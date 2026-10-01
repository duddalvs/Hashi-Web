import { useState } from 'react';
import { Filter, RotateCcw, Search, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import type { Catalogs, HistoryItem } from '../domain/models';
import { emptyFilters, type Filters as FilterValues } from '../domain/filters';
import { Field, Select, type Option } from './ui';

export function Filters({
  value,
  onChange,
  catalogs,
  items,
  type,
}: {
  value: FilterValues;
  onChange: (v: FilterValues) => void;
  catalogs: Catalogs;
  items: HistoryItem[];
  type: 'registro' | 'manutencao' | 'todos';
}) {
  const [expanded, setExpanded] = useState(false);
  const set = (key: keyof FilterValues, v: string) => onChange({ ...value, [key]: v });
  const unique = (values: (string | null | undefined)[]): Option[] =>
    [...new Set(values.filter((v): v is string => !!v))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((v) => ({ value: v, label: v }));
  const details = items.flatMap((i) => i.detalhes);
  const drivers = unique([
    ...catalogs.employees.map((e) => e.nome),
    ...details.map((d) => d.responsavel),
  ]);
  const active = Object.entries(value).filter(([, v]) => v).length;
  const labels: Record<string, string> = {
    search: 'Busca',
    start: 'De',
    end: 'Até',
    contract: 'Contrato',
    driver: 'Motorista',
    plate: 'Placa',
    model: 'Modelo',
    vehicleType: 'Tipo de veículo',
    service: 'Serviço',
    minCost: 'Custo mínimo',
    maxCost: 'Custo máximo',
    minTeams: 'Mín. equipes',
    maxTeams: 'Máx. equipes',
    sentStart: 'Envio de',
    sentEnd: 'Envio até',
    note: 'Observação',
    type: 'Categoria',
  };
  const invalid =
    (value.start && value.end && value.start > value.end) ||
    (value.sentStart && value.sentEnd && value.sentStart > value.sentEnd) ||
    (value.minCost && value.maxCost && Number(value.minCost) > Number(value.maxCost)) ||
    (value.minTeams && value.maxTeams && Number(value.minTeams) > Number(value.maxTeams));
  return (
    <section className="filter-panel">
      <div className="filter-heading">
        <h3>
          <Filter size={17} /> Filtrar registros{' '}
          {active > 0 && <span className="count-pill">{active}</span>}
        </h3>
        <button className="text-button muted" onClick={() => onChange({ ...emptyFilters })}>
          <RotateCcw size={14} /> Limpar filtros
        </button>
      </div>
      <div className="filter-main">
        <Field label="Data inicial">
          <input type="date" value={value.start} onChange={(e) => set('start', e.target.value)} />
        </Field>
        <Field label="Data final">
          <input type="date" value={value.end} onChange={(e) => set('end', e.target.value)} />
        </Field>
        <Select
          label="Contrato"
          value={value.contract}
          options={unique([
            ...catalogs.contracts.map((c) => c.nome),
            ...items.map((i) => i.contrato),
          ])}
          onChange={(v) => set('contract', v)}
          placeholder="Todos os contratos"
        />
        <Select
          label={type === 'registro' ? 'Responsável / motorista' : 'Motorista'}
          value={value.driver}
          options={
            type === 'registro'
              ? drivers
              : [{ value: '__unknown', label: 'Motorista não identificado' }, ...drivers]
          }
          onChange={(v) => set('driver', v)}
          placeholder="Todos os motoristas"
        />
        <Select
          label="Veículo"
          value={value.plate}
          options={unique([
            ...catalogs.vehicles.map((v) => v.placa),
            ...details.map((d) => d.placa),
          ])}
          onChange={(v) => set('plate', v)}
          placeholder="Todas as placas"
        />
      </div>
      <div className="filter-bottom">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Buscar registros"
            placeholder="Busque por nome, placa, contrato ou ID…"
            value={value.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>
        <button
          className={`button subtle ${expanded ? 'active' : ''}`}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={16} /> Mais filtros{' '}
          <ChevronDown size={14} className={expanded ? 'rotate' : ''} />
        </button>
      </div>
      {expanded && (
        <div className="filter-expanded">
          <Select
            label="Modelo do veículo"
            value={value.model}
            options={unique([
              ...catalogs.vehicles.map((v) => v.modelo),
              ...details.map((d) => d.modelo),
            ])}
            onChange={(v) => set('model', v)}
          />
          <Select
            label="Tipo de veículo"
            value={value.vehicleType}
            options={[
              { value: 'veiculo', label: 'Veículo' },
              { value: 'equipamento', label: 'Equipamento' },
            ]}
            onChange={(v) => set('vehicleType', v)}
          />
          {type === 'todos' && (
            <Select
              label="Categoria"
              value={value.type}
              options={[
                { value: 'registro', label: 'Registro de equipes' },
                { value: 'manutencao', label: 'Manutenção' },
              ]}
              onChange={(v) => set('type', v)}
            />
          )}
          {type !== 'registro' && (
            <>
              <Select
                label="Tipo de manutenção"
                value={value.service}
                options={unique([
                  ...catalogs.maintenanceTypes.map((t) => t.nome),
                  ...details.map((d) => d.servico),
                ])}
                onChange={(v) => set('service', v)}
              />
              <Field label="Custo mínimo (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value.minCost}
                  onChange={(e) => set('minCost', e.target.value)}
                  placeholder="0,00"
                />
              </Field>
              <Field label="Custo máximo (R$)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value.maxCost}
                  onChange={(e) => set('maxCost', e.target.value)}
                  placeholder="Sem limite"
                />
              </Field>
              <Field label="Observação contém">
                <input
                  value={value.note}
                  onChange={(e) => set('note', e.target.value)}
                  placeholder="Pesquise na observação"
                />
              </Field>
            </>
          )}
          {type !== 'manutencao' && (
            <>
              <Field label="Quantidade mínima de equipes">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={value.minTeams}
                  onChange={(e) => set('minTeams', e.target.value)}
                  placeholder="1"
                />
              </Field>
              <Field label="Quantidade máxima de equipes">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={value.maxTeams}
                  onChange={(e) => set('maxTeams', e.target.value)}
                  placeholder="50"
                />
              </Field>
            </>
          )}
          <Field label="Enviado a partir de">
            <input
              type="date"
              value={value.sentStart}
              onChange={(e) => set('sentStart', e.target.value)}
            />
          </Field>
          <Field label="Enviado até">
            <input
              type="date"
              value={value.sentEnd}
              onChange={(e) => set('sentEnd', e.target.value)}
            />
          </Field>
        </div>
      )}
      {invalid && (
        <div className="error-banner" role="alert">
          O início do intervalo não pode ser maior que o final.
        </div>
      )}
      {active > 0 && (
        <div className="filter-chips">
          {Object.entries(value)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <button
                key={k}
                className="filter-chip"
                onClick={() => set(k as keyof FilterValues, '')}
              >
                {labels[k]}: {v === '__unknown' ? 'Não identificado' : v}
                <X size={12} />
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
