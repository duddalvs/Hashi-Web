import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// --upload cria o bucket privado e envia somente objetos ausentes.
// Sem --upload, apenas confere as cópias remotas. Nunca remove arquivos nem sobrescreve objetos.
const root = fileURLToPath(new URL('../', import.meta.url));
const snapshot = JSON.parse(
  await readFile(join(root, '.tools/crlv-storage-preflight.json'), 'utf8'),
);
const documents = snapshot.rows[0].inventory.documents;
const bucket = 'hashi-crlv';
const base = new URL(process.env.SUPABASE_URL ?? '');
const secret = process.env.SUPABASE_SECRET_KEY ?? '';
if (
  base.protocol !== 'https:' ||
  !/^[a-z0-9]+\.supabase\.co$/.test(base.hostname) ||
  !secret.startsWith('sb_secret_')
)
  throw new Error('Configure a URL do projeto e a chave secreta somente no servidor.');
const upload = process.argv.includes('--upload');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const plan = [];
for (const doc of documents) {
  if (
    !/^CRLVDigital_[A-Z]{3}\d[A-Z\d]\d{2}_\d{4}\.pdf$/.test(doc.arquivo) ||
    !/^[a-f0-9]{64}$/.test(doc.sha256)
  )
    throw new Error('Documento com caminho inválido no inventário.');
  const bytes = await readFile(join(root, 'storage/veiculos/crlv/originais', doc.arquivo));
  if (
    bytes.length !== doc.tamanho_bytes ||
    sha(bytes) !== doc.sha256 ||
    !bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))
  )
    throw new Error(`Conteúdo local divergente: ${doc.arquivo}`);
  plan.push({ ...doc, path: `crlv/${doc.sha256}/${doc.arquivo}`, bytes });
}
if (!plan.length || new Set(plan.map((doc) => doc.path)).size !== plan.length)
  throw new Error('Inventário vazio ou com destinos duplicados.');
async function request(path, init = {}) {
  return fetch(new URL(`/storage/v1/${path}`, base), {
    ...init,
    headers: { apikey: secret, ...init.headers },
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
}
let response = await request(`bucket/${bucket}`);
let info = await response.json();
if (!response.ok) {
  if (!upload || info.message !== 'Bucket not found')
    throw new Error(`Bucket indisponível (HTTP ${response.status}).`);
  const created = await request('bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: bucket,
      name: bucket,
      public: false,
      file_size_limit: 20971520,
      allowed_mime_types: ['application/pdf'],
    }),
  });
  if (!created.ok)
    throw new Error(`Não foi possível criar o bucket privado (HTTP ${created.status}).`);
  response = await request(`bucket/${bucket}`);
  info = await response.json();
}
if (!response.ok || info.id !== bucket || info.public !== false)
  throw new Error('A migração exige o bucket privado hashi-crlv.');

const verified = [];
for (const doc of plan) {
  const objectUrl = `${bucket}/${doc.path}`;
  let remote = await request(`object/authenticated/${objectUrl}`);
  let sent = false;
  if (!remote.ok) {
    const missing = await remote.json().catch(() => ({}));
    if (
      !upload ||
      !['NoSuchKey', 'not_found', 'Object not found'].includes(
        missing.error ?? missing.code ?? missing.message,
      )
    )
      throw new Error(
        `Objeto indisponível: ${doc.arquivo} (HTTP ${remote.status}, ${missing.code ?? missing.error ?? 'erro'}).`,
      );
    const uploaded = await request(`object/${objectUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store',
        'x-upsert': 'false',
      },
      body: doc.bytes,
    });
    if (!uploaded.ok)
      throw new Error(`Envio não concluído: ${doc.arquivo} (HTTP ${uploaded.status}).`);
    sent = true;
    remote = await request(`object/authenticated/${objectUrl}`);
  }
  if (!remote.ok) throw new Error(`Falha ao conferir ${doc.arquivo}.`);
  const bytes = Buffer.from(await remote.arrayBuffer());
  if (bytes.length !== doc.tamanho_bytes || sha(bytes) !== doc.sha256)
    throw new Error(`Cópia remota divergente: ${doc.arquivo}.`);
  verified.push({
    id: doc.id,
    arquivo: doc.arquivo,
    storage_bucket: bucket,
    storage_path: doc.path,
    sha256: doc.sha256,
    tamanho_bytes: bytes.length,
    enviado_agora: sent,
  });
  await writeFile(
    join(root, 'storage/veiculos/crlv/relatorios/migracao-storage.json'),
    JSON.stringify(
      {
        conferido_em: new Date().toISOString(),
        bucket,
        privado: true,
        total_esperado: plan.length,
        total_conferido: verified.length,
        documentos: verified,
      },
      null,
      2,
    ) + '\n',
  );
  if (verified.length % 20 === 0 || verified.length === plan.length)
    console.log(`${verified.length}/${plan.length} PDFs conferidos no Supabase Storage.`);
}
console.log(
  `Concluído: ${verified.length} PDFs íntegros; ${verified.reduce((sum, doc) => sum + doc.tamanho_bytes, 0)} bytes. Originais locais preservados.`,
);
