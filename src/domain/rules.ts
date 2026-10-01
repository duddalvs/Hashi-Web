import { z } from 'zod';
import type { Catalogs, Entry, EntryType } from './models';

export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
export const matches = (text: string, query: string) =>
  normalize(query)
    .split(/\s+/)
    .every((part) => normalize(text).includes(part));
export const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const dateLabel = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Date(`${value}T12:00:00`).toLocaleDateString(
    'pt-BR',
    options ?? { day: '2-digit', month: '2-digit', year: 'numeric' },
  );
export const timeLabel = (value: string) =>
  new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  });
const id = z.number().int().positive();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data válida.')
  .refine((v) => {
    const parsed = new Date(`${v}T12:00:00Z`);
    return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v && v <= today();
  }, 'A data deve ser válida e não pode estar no futuro.');
const base = {
  id: z.uuid(),
  date,
  contractId: id,
  version: z.number().int().positive().optional(),
};
export const registrationSchema = z
  .object({
    ...base,
    teams: z
      .array(z.object({ responsavel_id: id, veiculo_id: id }))
      .min(1, 'Inclua pelo menos uma equipe.')
      .max(50, 'O limite é de 50 equipes.'),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.teams.map((t) => t.responsavel_id)).size !== v.teams.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Um responsável não pode se repetir no mesmo registro.',
      });
    if (new Set(v.teams.map((t) => t.veiculo_id)).size !== v.teams.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Um veículo não pode se repetir no mesmo registro.',
      });
  });
export const maintenanceSchema = z
  .object({
    ...base,
    vehicleId: id,
    typeId: id,
    driverId: id.nullable(),
    driverUnidentified: z.boolean().default(false),
    costDigits: z
      .string()
      .regex(/^\d{1,12}$/, 'Informe um valor entre R$ 0,00 e R$ 9.999.999.999,99.'),
    note: z
      .string()
      .default('')
      .refine((v) => Array.from(v).length <= 40, 'A observação permite até 40 caracteres.'),
  })
  .refine(
    (v) => (v.driverUnidentified ? v.driverId === null : v.driverId !== null),
    'Selecione o motorista ou escolha Motorista não identificado.',
  );
export function validateEntry(type: EntryType, entry: unknown, catalogs: Catalogs): Entry {
  const value =
    type === 'registro' ? registrationSchema.parse(entry) : maintenanceSchema.parse(entry);
  const active = (list: { id: number; ativo: boolean }[], target: number | null) =>
    list.some((item) => item.id === target && item.ativo);
  if (!active(catalogs.contracts, value.contractId))
    throw new Error('Selecione um contrato ativo.');
  const employees = catalogs.employees.filter((e) => !e.is_status);
  if ('teams' in value) {
    if (
      value.teams.some(
        (t) => !active(employees, t.responsavel_id) || !active(catalogs.vehicles, t.veiculo_id),
      )
    )
      throw new Error('Selecione responsáveis e veículos ativos em todas as equipes.');
  } else if (
    !active(catalogs.vehicles, value.vehicleId) ||
    !active(catalogs.maintenanceTypes, value.typeId) ||
    (!value.driverUnidentified && !active(employees, value.driverId))
  )
    throw new Error('Selecione veículo, motorista e tipo de manutenção ativos.');
  return value;
}
export function toRpc(type: EntryType, value: Entry) {
  const args = {
    p_id: value.id,
    p_data: value.date,
    p_contrato_id: value.contractId,
    ...(value.version ? { p_versao: value.version } : {}),
  };
  if (type === 'registro' && 'teams' in value)
    return {
      name: value.version ? 'editar_registro' : 'salvar_registro',
      args: { ...args, p_equipes: value.teams },
    };
  const m = value as import('./models').Maintenance;
  return {
    name: m.version ? 'editar_manutencao' : 'salvar_manutencao',
    args: {
      ...args,
      p_tipo_id: m.typeId,
      p_motorista_id: m.driverUnidentified ? null : m.driverId,
      p_veiculo_id: m.vehicleId,
      p_custo: Number(m.costDigits) / 100,
      p_observacao: m.note ?? '',
    },
  };
}
