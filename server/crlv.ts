import { createHash } from 'node:crypto';
import { crlvFileSchema, type CrlvFile } from '../src/domain/crlv';
import { ApiError } from './rpc';

export type CrlvReader = (document: CrlvFile) => Promise<Buffer>;
export type StorageFetch = (url: URL, init: RequestInit) => Promise<Response>;

// A chamada ocorre somente após a RPC validar sessão e vínculo. A chave nunca sai do servidor.
export function createCrlvReader(
  url: string,
  secretKey: string,
  request: StorageFetch = fetch,
): CrlvReader {
  return async (input) => {
    const document = crlvFileSchema.parse(input);
    let origin: URL;
    try {
      origin = new URL(url);
    } catch {
      throw new ApiError('O armazenamento de CRLVs precisa ser configurado no servidor.', 503);
    }
    if (
      origin.protocol !== 'https:' ||
      !/^[a-z0-9]+\.supabase\.co$/.test(origin.hostname) ||
      !secretKey.startsWith('sb_secret_')
    )
      throw new ApiError('O armazenamento de CRLVs precisa ser configurado no servidor.', 503);
    const endpoint = new URL(
      `/storage/v1/object/authenticated/${document.storage_bucket}/${document.storage_path}`,
      origin,
    );
    let response: Response;
    try {
      response = await request(endpoint, {
        headers: { apikey: secretKey },
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      throw new ApiError('Não foi possível consultar o CRLV no Supabase. Tente novamente.', 503);
    }
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      if (response.status === 404 || error?.code === 'NoSuchKey' || error?.error === 'not_found')
        throw new ApiError(
          'O CRLV não foi encontrado no armazenamento. Contate o administrador.',
          404,
        );
      throw new ApiError('Não foi possível consultar o CRLV no Supabase. Tente novamente.', 503);
    }
    if (!response.body || !response.headers.get('content-type')?.startsWith('application/pdf'))
      throw new ApiError('O arquivo do CRLV precisa ser conferido pelo administrador.', 409);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > document.tamanho_bytes) {
          await reader.cancel();
          throw new ApiError('O arquivo do CRLV precisa ser conferido pelo administrador.', 409);
        }
        chunks.push(value);
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('A transferência do CRLV foi interrompida. Tente novamente.', 503);
    } finally {
      reader.releaseLock();
    }
    const content = Buffer.concat(chunks, size);
    if (
      size !== document.tamanho_bytes ||
      !content.subarray(0, 5).equals(Buffer.from('%PDF-')) ||
      createHash('sha256').update(content).digest('hex') !== document.sha256
    )
      throw new ApiError('O arquivo do CRLV precisa ser conferido pelo administrador.', 409);
    return content;
  };
}
