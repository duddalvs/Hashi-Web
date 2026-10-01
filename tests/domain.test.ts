import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { demoCatalogs } from '../server/demo';
import {
  maintenanceSchema,
  registrationSchema,
  today,
  toRpc,
  validateEntry,
} from '../src/domain/rules';
import { csv, emptyFilters, filterRows } from '../src/domain/filters';
import type { HistoryItem, Maintenance } from '../src/domain/models';
const base = { id: randomUUID(), date: today(), contractId: 1 };
const maintenance: Maintenance = {
  ...base,
  vehicleId: 1,
  typeId: 1,
  driverId: null,
  driverUnidentified: true,
  costDigits: '0',
  note: '😀'.repeat(40),
};
test('dates reject future, impossible dates and malformed pasted values', () => {
  for (const date of ['2099-01-01', '2025-02-29', '2026-04-31', '29/09/2026', ''])
    assert.equal(maintenanceSchema.safeParse({ ...maintenance, date }).success, false);
  assert.equal(maintenanceSchema.safeParse({ ...maintenance, date: '2024-02-29' }).success, true);
});
test('unidentified driver is explicit; real driver cannot be silently dropped', () => {
  assert.equal(
    maintenanceSchema.safeParse({ ...maintenance, driverUnidentified: false }).success,
    false,
  );
  assert.equal(maintenanceSchema.safeParse({ ...maintenance, driverId: 1 }).success, false);
  assert.equal(maintenanceSchema.safeParse(maintenance).success, true);
});
test('Unicode note limit, blank cost, zero cost and numeric bounds', () => {
  assert.equal(maintenanceSchema.safeParse(maintenance).success, true);
  assert.equal(
    maintenanceSchema.safeParse({ ...maintenance, note: '😀'.repeat(41) }).success,
    false,
  );
  for (const costDigits of ['', '-1', '1.55', 'abc', '1000000000000'])
    assert.equal(maintenanceSchema.safeParse({ ...maintenance, costDigits }).success, false);
  assert.equal(
    maintenanceSchema.safeParse({ ...maintenance, costDigits: '999999999999' }).success,
    true,
  );
});
test('teams are limited and duplicate people/vehicles are rejected on server and client', () => {
  const team = { responsavel_id: 1, veiculo_id: 1 };
  assert.equal(registrationSchema.safeParse({ ...base, teams: [] }).success, false);
  assert.equal(
    registrationSchema.safeParse({ ...base, teams: Array(51).fill(team) }).success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...base, teams: [team, { responsavel_id: 2, veiculo_id: 1 }] })
      .success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...base, teams: [team, { responsavel_id: 1, veiculo_id: 2 }] })
      .success,
    false,
  );
  assert.equal(
    registrationSchema.safeParse({ ...base, teams: [team, { responsavel_id: 2, veiculo_id: 2 }] })
      .success,
    true,
  );
});
test('inactive and status catalog entries are rejected', () => {
  const catalogs = structuredClone(demoCatalogs);
  catalogs.employees[0].is_status = true;
  assert.throws(() =>
    validateEntry('registro', { ...base, teams: [{ responsavel_id: 1, veiculo_id: 1 }] }, catalogs),
  );
  catalogs.vehicles[0].ativo = false;
  assert.throws(() => validateEntry('manutencao', maintenance, catalogs));
});
test('RPC conversion preserves ID, version, explicit null, cents and note', () => {
  const call = toRpc('manutencao', { ...maintenance, version: 3, costDigits: '12345' });
  assert.equal(call.name, 'editar_manutencao');
  assert.equal(call.args.p_id, maintenance.id);
  assert.equal(call.args.p_versao, 3);
  assert.equal('p_custo' in call.args && call.args.p_custo, 123.45);
  assert.equal('p_motorista_id' in call.args && call.args.p_motorista_id, null);
  assert.equal('p_observacao' in call.args && call.args.p_observacao, maintenance.note);
});
const item: HistoryItem = {
  id: base.id,
  tipo: 'registro',
  data: '2026-09-22',
  contrato: 'São Gonçalo',
  placas: ['BBE9E90', 'BBH1E97'],
  created_at: '2026-09-23T01:00:00Z',
  custo: null,
  detalhes: [
    { equipe: 1, responsavel: 'André Pereira', placa: 'BBE9E90', modelo: 'Accelo' },
    { equipe: 2, responsavel: 'João Santos', placa: 'BBH1E97', modelo: 'Ford' },
  ],
};
test('combined driver and vehicle filters match the same team', () => {
  assert.equal(
    filterRows([item], { ...emptyFilters, driver: 'André Pereira', plate: 'BBH1E97' }, demoCatalogs)
      .length,
    0,
  );
  assert.equal(
    filterRows([item], { ...emptyFilters, driver: 'André Pereira', plate: 'BBE9E90' }, demoCatalogs)
      .length,
    1,
  );
});
test('date range includes endpoints; created date uses Sao Paulo; search ignores accents', () => {
  assert.equal(
    filterRows(
      [item],
      {
        ...emptyFilters,
        start: '2026-09-22',
        end: '2026-09-22',
        sentStart: '2026-09-22',
        sentEnd: '2026-09-22',
        search: 'andre goncalo',
      },
      demoCatalogs,
    ).length,
    1,
  );
  assert.equal(
    filterRows([item], { ...emptyFilters, start: '2026-09-23' }, demoCatalogs).length,
    0,
  );
});
test('cost filters exclude non-maintenance rows, preserve zero and unknown drivers', () => {
  const m: HistoryItem = {
    ...item,
    tipo: 'manutencao',
    custo: 0,
    detalhes: [{ ...item.detalhes[0], responsavel: null }],
  };
  assert.equal(
    filterRows([item, m], { ...emptyFilters, maxCost: '0', driver: '__unknown' }, demoCatalogs)
      .length,
    1,
  );
});
test('CSV is quoted, contains BOM and prevents spreadsheet formula injection', () => {
  const rows = filterRows([{ ...item, contrato: '=HYPERLINK("bad")' }], emptyFilters, demoCatalogs);
  const result = csv(rows);
  assert.ok(result.startsWith('\uFEFF'));
  assert.ok(result.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(result.includes('André Pereira'));
});
