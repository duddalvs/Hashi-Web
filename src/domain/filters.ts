import type { Catalogs, HistoryDetail, HistoryItem } from './models';
import { matches } from './rules';
export type Filters = {
  search: string;
  start: string;
  end: string;
  contract: string;
  driver: string;
  plate: string;
  model: string;
  vehicleType: string;
  service: string;
  minCost: string;
  maxCost: string;
  minTeams: string;
  maxTeams: string;
  sentStart: string;
  sentEnd: string;
  note: string;
  type: string;
};
export const emptyFilters: Filters = {
  search: '',
  start: '',
  end: '',
  contract: '',
  driver: '',
  plate: '',
  model: '',
  vehicleType: '',
  service: '',
  minCost: '',
  maxCost: '',
  minTeams: '',
  maxTeams: '',
  sentStart: '',
  sentEnd: '',
  note: '',
  type: '',
};
export type Row = { item: HistoryItem; detail: HistoryDetail; key: string };
export function filterRows(items: HistoryItem[], filters: Filters, catalogs: Catalogs): Row[] {
  const f = filters;
  return items
    .flatMap((item) => {
      const sent = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
        new Date(item.created_at),
      );
      if (
        (f.start && item.data < f.start) ||
        (f.end && item.data > f.end) ||
        (f.contract && item.contrato !== f.contract) ||
        (f.type && item.tipo !== f.type) ||
        (f.sentStart && sent < f.sentStart) ||
        (f.sentEnd && sent > f.sentEnd)
      )
        return [];
      if (
        (f.minCost && (item.custo === null || item.custo < Number(f.minCost))) ||
        (f.maxCost && (item.custo === null || item.custo > Number(f.maxCost)))
      )
        return [];
      if (
        (f.minTeams && (item.tipo !== 'registro' || item.detalhes.length < Number(f.minTeams))) ||
        (f.maxTeams && (item.tipo !== 'registro' || item.detalhes.length > Number(f.maxTeams)))
      )
        return [];
      return item.detalhes.flatMap((detail, index) => {
        if (
          (f.driver === '__unknown' && detail.responsavel !== null) ||
          (f.driver && f.driver !== '__unknown' && detail.responsavel !== f.driver) ||
          (f.plate && detail.placa !== f.plate) ||
          (f.model && detail.modelo !== f.model) ||
          (f.service && detail.servico !== f.service) ||
          (f.note && !matches(detail.observacao ?? '', f.note))
        )
          return [];
        if (
          f.vehicleType &&
          catalogs.vehicles.find((v) => v.placa === detail.placa)?.tipo !== f.vehicleType
        )
          return [];
        if (
          f.search &&
          !matches(
            [
              item.id,
              item.contrato,
              detail.responsavel,
              detail.placa,
              detail.modelo,
              detail.servico,
              detail.observacao,
            ].join(' '),
            f.search,
          )
        )
          return [];
        return [{ item, detail, key: `${item.id}-${index}` }];
      });
    })
    .sort(
      (a, b) =>
        b.item.data.localeCompare(a.item.data) ||
        b.item.created_at.localeCompare(a.item.created_at),
    );
}
export function csv(rows: Row[]): string {
  const safe = (v: unknown) => {
    const value = String(v ?? '');
    return `"${(/^[\s]*[=+@\-\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`;
  };
  const lines = [
    [
      'ID',
      'Tipo',
      'Data',
      'Contrato',
      'Equipe',
      'Responsável / motorista',
      'Placa',
      'Modelo',
      'Serviço',
      'Observação',
      'Custo (R$)',
      'Enviado em',
    ],
    ...rows.map(({ item: i, detail: d }) => [
      i.id,
      i.tipo,
      i.data,
      i.contrato,
      d.equipe ?? '',
      d.responsavel ?? 'Motorista não identificado',
      d.placa,
      d.modelo,
      d.servico ?? '',
      d.observacao ?? '',
      i.custo === null ? '' : i.custo.toFixed(2).replace('.', ','),
      i.created_at,
    ]),
  ];
  return '\uFEFF' + lines.map((line) => line.map(safe).join(';')).join('\r\n');
}
