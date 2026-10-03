import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Importação supervisionada: usa os campos previamente conferidos dos PDFs e um snapshot do banco.
// Sem --apply, apenas prepara o plano. Nunca executa SQL nem acessa a rede.
const workspace = fileURLToPath(new URL('../', import.meta.url));
const base = join(workspace, 'storage/veiculos/crlv');
const reports = join(base, 'relatorios');
const readJson = async (path) => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const documents = await readJson(join(reports, 'leitura-conteudo.json'));
const vehicles = (await readJson(join(workspace, '.tools/crlv-preflight.json'))).rows[0].inventory
  .veiculos;
const original = await readJson(join(reports, 'inventario-original.json'));
const normalize = (value) => value.toUpperCase().replace(/[\s-]/g, '');
const byPlate = new Map(vehicles.map((v) => [normalize(v.placa), v]));
if (byPlate.size !== vehicles.length)
  throw new Error('Há placas duplicadas no banco. Revise os vínculos.');
const plan = [];
for (const doc of documents) {
  const entry = original.find((r) => r.arquivo === doc.arquivo_original);
  if (!entry || entry.sha256.toLowerCase() !== doc.sha256 || entry.bytes !== doc.tamanho)
    throw new Error(`Documento diverge do inventário original: ${doc.arquivo_original}`);
  if (doc.tipo_documento !== 'CRLV') {
    plan.push({
      ...doc,
      destino: `outros-documentos/${doc.tipo_documento === 'CNH' ? 'CNHDigital_2020' : 'ATPVe_KYU1G47_2024'}.pdf`,
    });
    continue;
  }
  if (
    !doc.validado ||
    !/^[A-Z]{3}\d[A-Z\d]\d{2}$/.test(doc.placa) ||
    !/^20\d{2}-\d{2}-\d{2}$/.test(doc.data)
  )
    throw new Error(`Documento pendente de conferência: ${doc.arquivo_original}`);
  const direct = byPlate.get(doc.placa);
  const evidence = direct
    ? []
    : documents.filter(
        (other) =>
          other.tipo_documento === 'CRLV' &&
          doc.chassi &&
          other.chassi === doc.chassi &&
          other.placa_anterior === doc.placa &&
          byPlate.has(other.placa),
      );
  const ids = [...new Set(evidence.map((r) => byPlate.get(r.placa).id))];
  if (ids.length > 1) throw new Error(`Chassi com vínculo ambíguo: ${doc.arquivo_original}`);
  const vehicleId = direct?.id ?? ids[0] ?? null;
  const year = Number(doc.data.slice(0, 4));
  const name = `CRLVDigital_${doc.placa}_${year}.pdf`;
  const hash = doc.sha256;
  const id = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  plan.push({
    ...doc,
    id,
    veiculo_id: vehicleId,
    ano_documento: year,
    destino: `originais/${name}`,
    criterio_vinculo: direct
      ? 'placa'
      : ids.length
        ? 'chassi_e_placa_anterior'
        : 'sem_correspondencia',
    evidencia: evidence.map((r) => r.arquivo_original),
  });
}
if (
  plan.length !== original.length ||
  new Set(plan.map((r) => r.destino.toLowerCase())).size !== plan.length
)
  throw new Error('Arquivos faltantes ou colisão de nomes. Nenhum arquivo foi alterado.');
function safePath(path) {
  const absolute = resolve(base, path);
  const local = relative(workspace, absolute);
  if (local.startsWith('..') || isAbsolute(local)) throw new Error('Caminho fora do projeto.');
  return absolute;
}
// Confere todos os caminhos, colisões e hashes antes da primeira movimentação.
for (const doc of plan) {
  const from = safePath(`originais/${doc.arquivo_original}`);
  const to = safePath(doc.destino);
  const sourceExists = await stat(from)
    .then(() => true)
    .catch(() => false);
  const destinationExists = await stat(to)
    .then(() => true)
    .catch(() => false);
  if (from !== to && sourceExists && destinationExists)
    throw new Error(`Destino já existe: ${doc.destino}`);
  const content = await readFile(sourceExists ? from : to);
  if (createHash('sha256').update(content).digest('hex') !== doc.sha256)
    throw new Error(`Hash divergente: ${doc.arquivo_original}`);
}
await writeFile(join(reports, 'plano-organizacao.json'), JSON.stringify(plan, null, 2) + '\n');
if (process.argv.includes('--apply')) {
  await mkdir(join(base, 'outros-documentos'), { recursive: true });
  for (const doc of plan) {
    const from = safePath(`originais/${doc.arquivo_original}`);
    const to = safePath(doc.destino);
    if (
      from !== to &&
      (await stat(from)
        .then(() => true)
        .catch(() => false))
    )
      await rename(from, to);
    if (
      createHash('sha256')
        .update(await readFile(to))
        .digest('hex') !== doc.sha256
    )
      throw new Error('Falha na integridade após renomear.');
  }
  await writeFile(join(reports, 'organizacao-aplicada.json'), JSON.stringify(plan, null, 2) + '\n');
}
const crlvs = plan.filter((r) => r.tipo_documento === 'CRLV');
const quote = (value) =>
  value === null || value === undefined ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const values = crlvs.map((r) =>
  [r.id, r.veiculo_id, `crlv/${r.sha256}/${r.destino.split('/').at(-1)}`].map(quote).join(', '),
);
const sql = `-- Requer a migration 202610020003_crlv_vinculo_minimo.sql e os PDFs já enviados ao Storage.\nINSERT INTO public.veiculo_documentos (id, veiculo_id, storage_path) VALUES\n(${values.join('),\n(')})\nON CONFLICT (storage_path) DO NOTHING;\n`;
await writeFile(join(reports, 'importar-crlv.sql'), sql);
const summary = {
  total: plan.length,
  crlvs: crlvs.length,
  renomeados: crlvs.filter((r) => r.destino !== `originais/${r.arquivo_original}`).length,
  outros_documentos: plan.length - crlvs.length,
  documentos_vinculados: crlvs.filter((r) => r.veiculo_id !== null).length,
  veiculos_com_crlv: new Set(crlvs.map((r) => r.veiculo_id).filter((v) => v !== null)).size,
  documentos_sem_veiculo: crlvs.filter((r) => r.veiculo_id === null).length,
  veiculos_sem_crlv: vehicles
    .filter((v) => v.tipo === 'veiculo' && !crlvs.some((r) => r.veiculo_id === v.id))
    .map((v) => v.placa),
};
await writeFile(join(reports, 'resumo-conteudo.json'), JSON.stringify(summary, null, 2) + '\n');
const csv = [
  [
    'arquivo_original',
    'destino',
    'tipo_documento',
    'placa',
    'modelo',
    'data',
    'exercicio',
    'veiculo_id',
    'criterio_vinculo',
  ],
  ...plan.map((r) => [
    r.arquivo_original,
    r.destino,
    r.tipo_documento,
    r.placa,
    r.modelo,
    r.data,
    r.exercicio,
    r.veiculo_id,
    r.criterio_vinculo,
  ]),
]
  .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';'))
  .join('\r\n');
await writeFile(join(reports, 'conferencia-conteudo.csv'), '\uFEFF' + csv + '\r\n');
console.log(JSON.stringify(summary, null, 2));
