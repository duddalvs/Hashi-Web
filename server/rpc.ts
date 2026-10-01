export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = '',
  ) {
    super(message);
  }
}
export type Rpc = (name: string, args?: Record<string, unknown>) => Promise<unknown>;
export const createRpc =
  (url: string, key: string): Rpc =>
  async (name, args = {}) => {
    if (!url || !key.startsWith('sb_publishable_'))
      throw new ApiError('A conexão com o banco precisa ser configurada no servidor.', 503);
    let response: Response;
    try {
      response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      throw new ApiError('Não foi possível conectar ao banco. Tente novamente.', 503);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const code = data?.code ?? '';
      if (name.startsWith('web_') && code === 'PGRST202')
        throw new ApiError(
          'A atualização administrativa do banco ainda não foi instalada. Contate o responsável pelo sistema.',
          503,
          code,
        );
      throw new ApiError(
        code === '28000'
          ? 'Sua sessão expirou. Entre novamente.'
          : (data?.message ?? 'Não foi possível concluir a operação.'),
        code === '28000'
          ? 401
          : code === '42501'
            ? 403
            : code === '23505'
              ? 409
              : /vers[aã]o|alterado|concorr/i.test(data?.message ?? '')
                ? 409
                : 400,
        code,
      );
    }
    if (data?.error) throw new ApiError(String(data.error), /expir/i.test(data.error) ? 401 : 400);
    return data;
  };
