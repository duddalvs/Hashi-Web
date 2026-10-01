import { randomUUID } from 'node:crypto';
import type { Catalogs, Entry, HistoryItem, Profile } from '../src/domain/models';
import { today } from '../src/domain/rules';
import { ApiError, type Rpc } from './rpc';
import {
  adminUserSchema,
  catalogKindSchema,
  catalogSchemas,
  createUserSchema,
  passwordSchema,
  type AdminUser,
} from '../src/domain/admin';

// Isolated examples: no demo operation reaches Supabase.
export const demoCatalogs: Catalogs = {
  employees: [
    'Carlos Oliveira',
    'André Pereira',
    'Fernando Ribeiro',
    'Marcos Silva',
    'João Santos',
    'Rafael Costa',
    'Pedro Almeida',
    'Bruno Souza',
  ].map((nome, i) => ({ id: i + 1, nome, ativo: true, is_status: false })),
  vehicles: [
    'BBE9E90',
    'BBH1E97',
    'BDU9C81',
    'BEA5H11',
    'KQS8B71',
    'LMP9H12',
    'SP-6539',
    'RJW0J69',
  ].map((placa, i) => ({
    id: i + 1,
    placa,
    modelo: [
      'M.BENZ/ACCELO 815 CE',
      'M.BENZ/ACCELO 815 CE',
      'M.BENZ/ACCELO 815 CE',
      'VW/9.170 DRC 4X2',
      'M.BENZ/ATEGO 2430',
      'FORD',
      'RETROESCAVADEIRA',
      'M.BENZ/ACCELO 815 CE',
    ][i],
    tipo: i === 6 ? 'equipamento' : 'veiculo',
    ativo: true,
  })),
  contracts: ['Duque de Caxias', 'Belford Roxo', 'São Gonçalo', 'Magé', 'Saquarema'].map(
    (nome, i) => ({ id: i + 1, nome, ativo: true }),
  ),
  maintenanceTypes: ['Mecânica', 'Hidráulica', 'Pneus', 'Lanternagem', 'Outros'].map((nome, i) => ({
    id: i + 1,
    nome,
    ativo: true,
  })),
};
type DemoSession = {
  profile: Profile;
  catalogs: Catalogs;
  users: AdminUser[];
  entries: Map<string, Entry>;
  history: HistoryItem[];
  expires: number;
};
export function createDemo() {
  const sessions = new Map<string, DemoSession>();
  const asHistory = (entry: Entry, demoCatalogs: Catalogs): HistoryItem => {
    const contract = demoCatalogs.contracts.find((c) => c.id === entry.contractId)!;
    const teams =
      'teams' in entry
        ? entry.teams
        : [{ responsavel_id: entry.driverId, veiculo_id: entry.vehicleId }];
    return {
      id: entry.id,
      tipo: 'teams' in entry ? 'registro' : 'manutencao',
      data: entry.date,
      contrato: contract.nome,
      created_at: `${entry.date}T11:30:00.000Z`,
      custo: 'costDigits' in entry ? Number(entry.costDigits) / 100 : null,
      placas: teams.map((t) => demoCatalogs.vehicles.find((v) => v.id === t.veiculo_id)!.placa),
      detalhes: teams.map((t, i) => {
        const vehicle = demoCatalogs.vehicles.find((v) => v.id === t.veiculo_id)!;
        return {
          equipe: 'teams' in entry ? i + 1 : undefined,
          responsavel: demoCatalogs.employees.find((e) => e.id === t.responsavel_id)?.nome ?? null,
          placa: vehicle.placa,
          modelo: vehicle.modelo,
          ...('typeId' in entry
            ? {
                servico: demoCatalogs.maintenanceTypes.find((t) => t.id === entry.typeId)?.nome,
                observacao: entry.note ?? '',
              }
            : {}),
        };
      }),
    };
  };
  function start(role: 'admin' | 'funcionario' = 'admin') {
    for (const [key, value] of sessions) if (value.expires < Date.now()) sessions.delete(key);
    if (sessions.size >= 100)
      throw new ApiError('Demonstração ocupada. Tente novamente mais tarde.', 503);
    const profile: Profile = {
      id: randomUUID(),
      nome: 'Visitante',
      sobrenome: '',
      login: 'demonstracao',
      ativo: true,
      perfil: role,
    };
    const entries = new Map<string, Entry>();
    for (let day = 0; day < (role === 'admin' ? 8 : 3); day++) {
      const date = new Date(`${today()}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() - day);
      const value = date.toISOString().slice(0, 10);
      for (let contract = 1; contract <= (day < 2 ? 3 : 2); contract++) {
        const entry: Entry = {
          id: randomUUID(),
          date: value,
          contractId: contract,
          version: 1,
          teams: Array.from({ length: contract === 1 ? 3 : 2 }, (_, i) => ({
            responsavel_id: (((contract - 1) * 2 + i) % 8) + 1,
            veiculo_id: (((contract - 1) * 2 + i) % 8) + 1,
          })),
        };
        entries.set(entry.id, entry);
      }
      const maintenance: Entry = {
        id: randomUUID(),
        date: value,
        contractId: (day % 3) + 1,
        version: 1,
        vehicleId: (day % 8) + 1,
        driverId: day % 3 === 0 ? null : (day % 8) + 1,
        driverUnidentified: day % 3 === 0,
        typeId: (day % 5) + 1,
        costDigits: String([85000, 42000, 126000, 28000, 65000, 38000, 150000, 99000][day]),
        note: ['Troca de óleo e filtros', 'Revisão do sistema', 'Substituição de pneus'][day % 3],
      };
      entries.set(maintenance.id, maintenance);
    }
    const token = `demo-${randomUUID()}`;
    const catalogs = structuredClone(demoCatalogs);
    sessions.set(token, {
      profile,
      catalogs,
      users: [
        adminUserSchema.parse({ ...profile, created_at: new Date().toISOString() }),
        {
          id: randomUUID(),
          nome: 'Ana',
          sobrenome: 'Demonstração',
          login: 'ana_demo',
          perfil: 'funcionario',
          ativo: true,
          created_at: new Date().toISOString(),
        },
      ],
      entries,
      history: [...entries.values()].map((entry) => asHistory(entry, catalogs)),
      expires: Date.now() + 3600000,
    });
    return { token, profile, expiresAt: new Date(Date.now() + 3600000).toISOString() };
  }
  const rpc: Rpc = async (name, args = {}) => {
    const token = String(args.p_token ?? '');
    const session = sessions.get(token);
    if (!session || session.expires < Date.now())
      throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
    if (name.startsWith('web_') && session.profile.perfil !== 'admin')
      throw new ApiError('Somente administradores podem gerenciar cadastros e usuários.', 403);
    switch (name) {
      case 'meu_perfil':
        return session.profile;
      case 'listar_catalogos':
        return structuredClone(session.catalogs);
      case 'web_criar_cadastro': {
        const kind = catalogKindSchema.parse(args.p_tipo);
        const key =
          kind === 'veiculos' ? 'vehicles' : kind === 'funcionarios' ? 'employees' : 'contracts';
        const list = session.catalogs[key];
        const id = Math.max(0, ...list.map((item) => item.id)) + 1;
        if (kind === 'veiculos') {
          const value = catalogSchemas.veiculos.parse(args.p_dados);
          if (
            session.catalogs.vehicles.some(
              (v) => v.placa.replace(/[ -]/g, '') === value.placa.replace(/[ -]/g, ''),
            )
          )
            throw new ApiError('Já existe um veículo ou equipamento com essa identificação.', 409);
          const item = { id, ...value, ativo: true };
          session.catalogs.vehicles.push(item);
          return item;
        }
        const value = catalogSchemas[kind].parse(args.p_dados);
        const refs =
          kind === 'funcionarios' ? session.catalogs.employees : session.catalogs.contracts;
        if (refs.some((v) => v.nome.toLowerCase() === value.nome.toLowerCase()))
          throw new ApiError('Já existe um cadastro com esse nome.', 409);
        const item = { id, ...value, ativo: true, is_status: false };
        refs.push(item);
        return item;
      }
      case 'web_listar_usuarios':
        return structuredClone(session.users);
      case 'web_criar_usuario': {
        const value = createUserSchema.parse({
          login: args.p_usuario,
          password: args.p_senha,
          nome: args.p_nome,
          sobrenome: args.p_sobrenome,
          perfil: args.p_perfil,
        });
        if (session.users.some((u) => u.login === value.login))
          throw new ApiError('Esse usuário já existe. Nenhuma senha foi alterada.', 409);
        const user = adminUserSchema.parse({
          ...value,
          id: randomUUID(),
          ativo: true,
          created_at: new Date().toISOString(),
        });
        session.users.push(user);
        return user;
      }
      case 'web_definir_senha':
        passwordSchema.parse(args.p_senha);
        if (!session.users.some((u) => u.id === args.p_usuario_id))
          throw new ApiError('Usuário não encontrado.', 404);
        if (session.profile.id === args.p_usuario_id) sessions.delete(token);
        return null;
      case 'encerrar_sessao':
        sessions.delete(token);
        return null;
      case 'buscar_historico':
        return session.history
          .filter((h) => args.p_tipo === 'todos' || h.tipo === args.p_tipo)
          .slice(Number(args.p_offset), Number(args.p_offset) + Number(args.p_limite));
      case 'obter_envio':
        return session.entries.get(String(args.p_id)) ?? null;
      case 'ultimo_veiculo_motorista': {
        const last = [...session.entries.values()]
          .filter(
            (e) =>
              'teams' in e &&
              e.id !== args.p_excluir_registro &&
              e.teams.some((t) => t.responsavel_id === args.p_motorista_id),
          )
          .sort((a, b) => b.date.localeCompare(a.date))[0];
        return last && 'teams' in last
          ? {
              vehicleId: last.teams.find((t) => t.responsavel_id === args.p_motorista_id)
                ?.veiculo_id,
              date: last.date,
            }
          : null;
      }
      case 'apagar_envio':
        if (session.profile.perfil !== 'admin')
          throw new ApiError('Somente administradores podem excluir envios.', 403);
        session.entries.delete(String(args.p_id));
        session.history = session.history.filter((h) => h.id !== args.p_id);
        return null;
      default: {
        if (!/^(salvar|editar)_(registro|manutencao)$/.test(name))
          throw new ApiError('Operação indisponível.');
        const old = session.entries.get(String(args.p_id));
        if (name.startsWith('editar') && !old) throw new ApiError('Envio não encontrado.', 404);
        if (old && args.p_versao !== old.version)
          throw new ApiError(
            'Este envio foi alterado. Reabra a edição para carregar a versão atual.',
            409,
          );
        const base = {
          id: String(args.p_id),
          date: String(args.p_data),
          contractId: Number(args.p_contrato_id),
          version: (old?.version ?? 0) + 1,
        };
        const entry: Entry = name.endsWith('registro')
          ? { ...base, teams: args.p_equipes as import('../src/domain/models').Team[] }
          : {
              ...base,
              vehicleId: Number(args.p_veiculo_id),
              typeId: Number(args.p_tipo_id),
              driverId: args.p_motorista_id === null ? null : Number(args.p_motorista_id),
              driverUnidentified: args.p_motorista_id === null,
              costDigits: String(Math.round(Number(args.p_custo) * 100)),
              note: String(args.p_observacao ?? ''),
            };
        session.entries.set(entry.id, entry);
        const history = asHistory(entry, session.catalogs);
        history.created_at =
          session.history.find((h) => h.id === entry.id)?.created_at ?? new Date().toISOString();
        session.history = [history, ...session.history.filter((h) => h.id !== entry.id)];
        return entry.id;
      }
    }
  };
  return { start, rpc };
}
