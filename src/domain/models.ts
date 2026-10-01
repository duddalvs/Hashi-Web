import { z } from 'zod';

export const referenceSchema = z.object({ id: z.number(), nome: z.string(), ativo: z.boolean() });
export const vehicleSchema = z.object({
  id: z.number(),
  placa: z.string(),
  modelo: z.string(),
  tipo: z.enum(['veiculo', 'equipamento']),
  ativo: z.boolean(),
});
export const profileSchema = z.object({
  id: z.string(),
  nome: z.string(),
  sobrenome: z.string().default(''),
  login: z.string(),
  ativo: z.boolean(),
  perfil: z.enum(['admin', 'funcionario']),
});
export const catalogsSchema = z.object({
  employees: z.array(referenceSchema.extend({ is_status: z.boolean().default(false) })),
  vehicles: z.array(vehicleSchema),
  contracts: z.array(referenceSchema),
  maintenanceTypes: z.array(referenceSchema),
});
export const detailSchema = z.object({
  equipe: z.number().optional(),
  servico: z.string().optional(),
  observacao: z.string().nullable().optional(),
  responsavel: z.string().nullable(),
  placa: z.string(),
  modelo: z.string(),
});
export const historySchema = z.object({
  id: z.string(),
  tipo: z.enum(['registro', 'manutencao']),
  data: z.string(),
  contrato: z.string(),
  placas: z.array(z.string()),
  detalhes: z.array(detailSchema),
  custo: z.coerce.number().nullable(),
  created_at: z.string(),
});
export type Catalogs = z.infer<typeof catalogsSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type HistoryItem = z.infer<typeof historySchema>;
export type HistoryDetail = z.infer<typeof detailSchema>;
export type EntryType = HistoryItem['tipo'];
export type Team = { responsavel_id: number | null; veiculo_id: number | null };
export type Registration = {
  id: string;
  date: string;
  contractId: number | null;
  teams: Team[];
  version?: number;
};
export type Maintenance = {
  id: string;
  date: string;
  contractId: number | null;
  vehicleId: number | null;
  driverId: number | null;
  driverUnidentified?: boolean;
  typeId: number | null;
  costDigits: string;
  note?: string;
  version?: number;
};
export type Entry = Registration | Maintenance;
export type Bootstrap = {
  profile: Profile;
  catalogs: Catalogs;
  history: HistoryItem[];
  syncedAt: string;
  demo: boolean;
};
