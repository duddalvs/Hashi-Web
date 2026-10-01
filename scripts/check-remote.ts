import 'dotenv/config';
import { createRpc, ApiError } from '../server/rpc';
const url = process.env.SUPABASE_URL ?? '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? '';
const rpc = createRpc(url, key);
const id = '00000000-0000-4000-8000-000000000000';
const p_token = '0'.repeat(64);
const common = { p_id: id, p_data: '2026-01-01', p_contrato_id: 1 };
const maintenance = {
  ...common,
  p_tipo_id: 1,
  p_motorista_id: null,
  p_veiculo_id: 1,
  p_custo: 0,
  p_observacao: '',
};
const operations = [
  ['meu_perfil', {}],
  ['listar_catalogos', {}],
  ['buscar_historico', { p_busca: '', p_limite: 100, p_offset: 0, p_tipo: 'todos' }],
  ['obter_envio', { p_id: id, p_tipo: 'registro' }],
  ['ultimo_veiculo_motorista', { p_motorista_id: 1, p_excluir_registro: id }],
  ['salvar_registro', { ...common, p_equipes: [{ responsavel_id: 1, veiculo_id: 1 }] }],
  [
    'editar_registro',
    { ...common, p_versao: 1, p_equipes: [{ responsavel_id: 1, veiculo_id: 1 }] },
  ],
  ['salvar_manutencao', maintenance],
  ['editar_manutencao', { ...maintenance, p_versao: 1 }],
  ['apagar_envio', { p_id: id, p_tipo: 'registro' }],
  [
    'web_criar_cadastro',
    { p_tipo: 'contratos', p_dados: { nome: 'Sessão inválida — não cadastrar' } },
  ],
  ['web_listar_usuarios', {}],
  [
    'web_criar_usuario',
    {
      p_usuario: 'invalid_session_check',
      p_senha: 'InvalidSessionOnly123!',
      p_perfil: 'funcionario',
      p_nome: 'Teste',
      p_sobrenome: 'Inválido',
    },
  ],
  ['web_definir_senha', { p_usuario_id: id, p_senha: 'InvalidSessionOnly123!' }],
] as const;
// Deliberately invalid sessions: checks signatures and rejection; never authenticates or writes records.
let failed = false;
for (const [name, args] of operations) {
  try {
    await rpc(name, { ...args, p_token });
    console.log(`FALHOU: ${name} aceitou uma sessão inválida.`);
    failed = true;
  } catch (err) {
    if (err instanceof ApiError && err.code === '28000')
      console.log(`OK ${name}: assinatura reconhecida, sessão inválida rejeitada.`);
    else {
      failed = true;
      console.log(`FALHOU ${name}: ${err instanceof Error ? err.message : 'erro'}`);
    }
  }
}
for (const table of [
  'usuarios',
  'funcionarios',
  'veiculos',
  'contratos',
  'tipos_manutencao',
  'registros_frota',
  'registro_equipes',
  'manutencoes',
]) {
  const response = await fetch(`${url}/rest/v1/${table}?select=id&limit=0`, {
    headers: { apikey: key },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  const blocked = !response.ok && body.code === '42501';
  console.log(
    `${blocked ? 'OK' : 'FALHOU'} ${table}: ${blocked ? 'leitura anônima bloqueada' : 'verificar acesso'}.`,
  );
  if (!blocked) failed = true;
}
process.exitCode = failed ? 1 : 0;
