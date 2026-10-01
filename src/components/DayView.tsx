import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  MapPin,
  Users,
  Truck,
  ArrowUpRight,
  CalendarCheck,
} from 'lucide-react';
import type { HistoryItem } from '../domain/models';
import { dateLabel, today } from '../domain/rules';
import { Empty } from './ui';
export function DayView({
  items,
  onView,
}: {
  items: HistoryItem[];
  onView: (item: HistoryItem) => void;
}) {
  const [month, setMonth] = useState('');
  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState<Set<string> | null>(null);
  const months = [...new Set(items.map((i) => i.data.slice(0, 7)))].sort().reverse();
  const groups = useMemo(() => {
    const map = new Map<string, HistoryItem[]>();
    for (const item of items) {
      if (month && !item.data.startsWith(month)) continue;
      map.set(item.data, [...(map.get(item.data) ?? []), item]);
    }
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [items, month]);
  const dates = groups.map(([day]) => day);
  const opened = open ?? new Set(dates.slice(0, 1));
  const totalTeams = groups.flatMap(([, v]) => v).reduce((sum, i) => sum + i.detalhes.length, 0);
  const toggle = (day: string) => {
    const next = new Set(opened);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setOpen(next);
  };
  const visible = selected ? groups.filter(([date]) => date === selected) : groups;
  return (
    <div className="day-view">
      <div className="day-intro">
        <div className="day-intro-icon">
          <CalendarDays size={22} />
        </div>
        <div>
          <h3>Sua operação, dia a dia</h3>
          <p>Escolha um dia e veja as equipes organizadas por contrato.</p>
        </div>
        <div className="day-controls">
          <select
            aria-label="Mês dos registros"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setSelected('');
              setOpen(null);
            }}
          >
            <option value="">Todos os meses</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {dateLabel(`${m}-01`, { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
          <button
            className="button secondary"
            onClick={() => {
              setMonth('');
              setSelected(today());
              setOpen(new Set([today()]));
            }}
          >
            <CalendarCheck size={16} /> Hoje
          </button>
        </div>
      </div>
      {groups.length > 0 && (
        <>
          <div className="day-strip">
            <button
              className={`day-tile all-days ${!selected ? 'selected' : ''}`}
              onClick={() => {
                setSelected('');
                setOpen(null);
              }}
            >
              <CalendarDays size={19} />
              <strong>Todos os dias</strong>
              <small>
                {groups.length} dias · {totalTeams} equipes
              </small>
            </button>
            {groups.slice(0, 12).map(([day, records]) => (
              <button
                key={day}
                className={`day-tile ${selected === day ? 'selected' : ''}`}
                onClick={() => {
                  setSelected(day);
                  setOpen(new Set([day]));
                }}
              >
                <span>{dateLabel(day, { weekday: 'short' }).replace('.', '')}</span>
                <strong>{day.slice(8)}</strong>
                <small>{records.reduce((n, r) => n + r.detalhes.length, 0)} equipes</small>
                {day === today() && <i />}
              </button>
            ))}
          </div>
          <div className="section-heading day-list-heading">
            <span>
              {selected
                ? dateLabel(selected, { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Dias com equipes registradas'}
            </span>
            <button
              className="text-button"
              onClick={() =>
                setOpen(
                  opened.size >= visible.length ? new Set() : new Set(visible.map(([day]) => day)),
                )
              }
            >
              {opened.size >= visible.length ? 'Recolher dias' : 'Expandir dias'}
            </button>
          </div>
        </>
      )}
      {!visible.length && (
        <Empty
          title={selected ? 'Nenhuma equipe registrada neste dia' : 'Nenhum registro neste período'}
          text="Os dias com lançamentos aparecerão aqui automaticamente."
          action={
            selected && (
              <button className="button secondary" onClick={() => setSelected('')}>
                Ver todos os dias
              </button>
            )
          }
        />
      )}
      {visible.map(([day, records]) => {
        const contracts = [...new Set(records.map((r) => r.contrato))];
        const count = records.reduce((sum, r) => sum + r.detalhes.length, 0);
        return (
          <section className={`day-group ${opened.has(day) ? 'expanded' : ''}`} key={day}>
            <button
              className="day-group-header"
              aria-expanded={opened.has(day)}
              onClick={() => toggle(day)}
            >
              <span className="day-date-box">
                <strong>{day.slice(8)}</strong>
                <small>{dateLabel(day, { month: 'short' }).replace('.', '')}</small>
              </span>
              <span className="day-title">
                <strong>
                  {dateLabel(day, { weekday: 'long' })}
                  {day === today() && <span className="badge orange">Hoje</span>}
                </strong>
                <small>{dateLabel(day)}</small>
              </span>
              <span className="day-summary">
                <span>
                  <Users size={15} />
                  {count} equipes
                </span>
                <span>
                  <MapPin size={15} />
                  {contracts.length} contratos
                </span>
              </span>
              {opened.has(day) ? <ChevronDown size={19} /> : <ChevronRight size={19} />}
            </button>
            {opened.has(day) && (
              <div className="day-contracts">
                {contracts.map((contract) => (
                  <div className="day-contract" key={contract}>
                    <div className="day-contract-title">
                      <span>
                        <span className="contract-dot" />
                        {contract}
                      </span>
                      <span>
                        {records
                          .filter((r) => r.contrato === contract)
                          .reduce((n, r) => n + r.detalhes.length, 0)}{' '}
                        equipes
                      </span>
                    </div>
                    <div className="team-cards">
                      {records
                        .filter((r) => r.contrato === contract)
                        .flatMap((record) =>
                          record.detalhes.map((detail, index) => (
                            <button
                              className="team-card"
                              key={`${record.id}-${index}`}
                              onClick={() => onView(record)}
                            >
                              <span className="team-card-top">
                                <span>
                                  EQUIPE {String(detail.equipe ?? index + 1).padStart(2, '0')}
                                </span>
                                <ArrowUpRight size={16} />
                              </span>
                              <strong>
                                <span className="mini-avatar">
                                  {detail.responsavel
                                    ?.split(' ')
                                    .map((s) => s[0])
                                    .slice(0, 2)
                                    .join('')}
                                </span>
                                {detail.responsavel}
                              </strong>
                              <span className="team-vehicle">
                                <Truck size={16} />
                                <span className="plate">{detail.placa}</span>
                                <small>{detail.modelo}</small>
                              </span>
                            </button>
                          )),
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
