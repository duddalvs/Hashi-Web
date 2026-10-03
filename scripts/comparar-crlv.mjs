import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

// Compara apenas nomes de arquivos com uma consulta já salva; não acessa o banco.
const root = fileURLToPath(new URL('../storage/veiculos/crlv/', import.meta.url));
const originals = join(root, 'originais');
const reports = join(root, 'relatorios');
const snapshotPath = join(reports, 'veiculos-banco.json');
const readJson = async (path) => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const snapshot = await readJson(snapshotPath);
const vehicles = snapshot.rows;
if (!Array.isArray(vehicles) || vehicles.some((row) => typeof row.placa !== 'string')) {
  throw new Error('A consulta deve conter rows com id, placa, tipo e ativo.');
}
const normalize = (value) => value.toUpperCase().replace(/[\s-]/g, '');
const byPlate = new Map();
for (const vehicle of vehicles) {
  const key = normalize(vehicle.placa);
  byPlate.set(key, [...(byPlate.get(key) ?? []), vehicle]);
}

const files = (await readdir(originals, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort();
const manifest = await readJson(join(reports, 'inventario-original.json'));
const manifestByName = new Map(manifest.map((entry) => [entry.arquivo, entry]));
const organization = await readJson(join(reports, 'organizacao-aplicada.json')).catch((error) => {
  if (error.code === 'ENOENT') return null;
  throw error;
});
const renamed = new Map(organization?.filter((r) => r.tipo_documento === 'CRLV')
  .map((r) => [r.destino.split('/').at(-1), r.arquivo_original]) ?? []);
const expected = organization ? renamed.size : manifest.length;
if (files.length !== expected) throw new Error('Quantidade diferente do inventário de CRLVs.');

const inventory = [];
for (const arquivo of files) {
  const bytes = await readFile(join(originals, arquivo));
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const original = manifestByName.get(renamed.get(arquivo) ?? arquivo);
  if (!original || original.sha256.toLowerCase() !== sha256 || original.bytes !== bytes.length) {
    throw new Error(`Arquivo divergente do inventário original: ${arquivo}`);
  }
  // O campo logo após CRLVDigital tem prioridade sobre outros códigos do nome.
  const standard = arquivo.match(/^CRLVDigital_([A-Z]{3}\d[A-Z\d]\d{2})(?=_)/i);
  const candidates = standard
    ? [standard[1]]
    : [...arquivo.matchAll(/(?:^|[^A-Z])([A-Z]{3}[ -]?\d[A-Z\d]\d{2})(?=$|[^A-Z\d])/gi)]
        .map((match) => match[1]);
  const unique = [...new Set(candidates.map(normalize))];
  const placa = unique.length === 1 ? unique[0] : null;
  const matches = placa ? byPlate.get(placa) ?? [] : [];
  const year = standard ? arquivo.match(/(?:_|exerc)(20\d{2})(?=[^\d]|$)/i)?.[1] : null;
  inventory.push({
    arquivo,
    placa,
    ano_no_nome: year ?? null,
    nome_padrao: /^CRLVDigital_[A-Z]{3}\d[A-Z\d]\d{2}_20\d{2}\.pdf$/i.test(arquivo),
    origem_placa: standard ? 'campo_CRLVDigital' : placa ? 'nome_alternativo' : 'nao_identificada',
    situacao: matches.length ? 'em_comum' : placa ? 'sem_correspondencia_no_banco' : 'revisar_nome',
    veiculo_ids: matches.map((vehicle) => vehicle.id).join(', '),
    bytes: bytes.length,
    sha256,
  });
}
const identified = inventory.filter((row) => row.placa);
const plateSet = new Set(identified.map((row) => row.placa));
const common = [...plateSet].filter((plate) => byPlate.has(plate)).sort();
const missing = vehicles.filter((row) => !plateSet.has(normalize(row.placa)));
const summary = {
  gerado_em: new Date().toISOString(),
  consulta_banco_salva_em: (await stat(snapshotPath)).mtime.toISOString(),
  tabela: 'public.veiculos',
  consulta_sql: 'SELECT id, placa, tipo, ativo FROM public.veiculos ORDER BY id;',
  metodo: 'Correspondência exata da placa no nome, ignorando caixa, espaços e hífens. Sem ler o conteúdo dos PDFs ou converter placas antigas para Mercosul. Arquivos sem placa identificável no nome ficam pendentes.',
  total_pdfs: inventory.length,
  arquivos_no_padrao: inventory.filter((row) => row.nome_padrao).length,
  arquivos_com_placa_identificada: identified.length,
  placas_distintas_identificadas: plateSet.size,
  arquivos_sem_placa_identificavel: inventory.length - identified.length,
  registros_no_banco: vehicles.length,
  registros_no_banco_por_tipo: Object.fromEntries([...new Set(vehicles.map((row) => row.tipo))]
    .map((type) => [type, vehicles.filter((row) => row.tipo === type).length])),
  placas_distintas_em_comum: common.length,
  arquivos_em_comum: inventory.filter((row) => row.situacao === 'em_comum').length,
  arquivos_em_comum_no_padrao: inventory.filter((row) => row.nome_padrao && row.situacao === 'em_comum').length,
  placas_identificadas_sem_correspondencia_no_banco: [...plateSet].filter((plate) => !byPlate.has(plate)).length,
  registros_do_banco_sem_correspondencia_nos_nomes: missing.length,
  integridade_dos_originais: 'Tamanhos e hashes SHA-256 conferem com o inventário original; renomeações são rastreadas em organizacao-aplicada.json.',
  placas_em_comum: common,
};
const csvCell = (value) => {
  const text = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};
const writeCsv = async (name, columns, rows) => {
  const csv = [columns, ...rows.map((row) => columns.map((column) => row[column]))]
    .map((row) => row.map(csvCell).join(';')).join('\r\n');
  await writeFile(join(reports, name), `\uFEFF${csv}\r\n`, 'utf8');
};
await mkdir(reports, { recursive: true });
const columns = ['arquivo', 'placa', 'ano_no_nome', 'nome_padrao', 'origem_placa', 'situacao', 'veiculo_ids'];
await writeCsv('comparacao-completa.csv', columns, inventory);
await writeCsv('placas-em-comum.csv', ['placa', 'veiculo_ids', 'arquivo', 'ano_no_nome'],
  inventory.filter((row) => row.situacao === 'em_comum').sort((a, b) => a.placa.localeCompare(b.placa)));
await writeCsv('placas-sem-correspondencia-no-banco.csv', columns,
  inventory.filter((row) => row.situacao === 'sem_correspondencia_no_banco'));
await writeCsv('arquivos-sem-placa-no-nome.csv', ['arquivo', 'situacao'], inventory.filter((row) => !row.placa));
await writeCsv('banco-sem-correspondencia-nos-nomes.csv', ['id', 'placa', 'tipo', 'ativo'], missing);
await writeFile(join(reports, 'resumo.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
