import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Clock3,
  MapPin,
  Plus,
  Truck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { Bootstrap, HistoryItem } from '../domain/models';
import { dateLabel, money, today } from '../domain/rules';
import { Empty } from './ui';
export function Overview({
  data,
  navigate,
  onNew,
  onView,
}: {
  data: Bootstrap;
  navigate: (page: string) => void;
  onNew: () => void;
  onView: (i: HistoryItem) => void;
}) {
  const regs = data.history.filter((h) => h.tipo === 'registro');
  const maintenance = data.history.filter((h) => h.tipo === 'manutencao');
  const todayRegs = regs.filter((r) => r.data === today());
  const teamCount = regs.reduce((n, r) => n + r.detalhes.length, 0);
  const totalCost = maintenance.reduce((n, r) => n + (r.custo ?? 0), 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const counts = days.map((day) =>
    regs.filter((i) => i.data === day).reduce((n, r) => n + r.detalhes.length, 0),
  );
  const max = Math.max(1, ...counts);
  const contracts = [...new Set(regs.map((r) => r.contrato))]
    .map((name) => ({
      name,
      count: regs.filter((r) => r.contrato === name).reduce((n, r) => n + r.detalhes.length, 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const recent = [...data.history]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);
  return (
    <>
      <section className="welcome">
        <div>
          <div className="eyebrow">SUA OPERAÇÃO EM UM SÓ LUGAR</div>
          <h1>
            Olá, {data.profile.nome.split(' ')[0]}
            <span className="orange-text">.</span>
          </h1>
          <p>Veja o que está acontecendo com suas equipes e sua frota.</p>
        </div>
        <button className="button primary" onClick={onNew}>
          <Plus size={18} /> Novo registro
        </button>
      </section>
      <div className="stats-grid">
        <button className="stat-card" onClick={() => navigate('equipes')}>
          <div className="stat-top">
            <span>Equipes registradas</span>
            <Users className="orange-text" size={21} />
          </div>
          <strong>{teamCount.toLocaleString('pt-BR')}</strong>
          <div className="stat-bottom">
            <span className="positive-dot" />
            {todayRegs.reduce((n, r) => n + r.detalhes.length, 0)} equipes na data de hoje
            <ArrowUpRight size={16} />
          </div>
        </button>
        <button className="stat-card" onClick={() => navigate('veiculos')}>
          <div className="stat-top">
            <span>Veículos no catálogo</span>
            <Truck className="blue-text" size={21} />
          </div>
          <strong>{data.catalogs.vehicles.length.toLocaleString('pt-BR')}</strong>
          <div className="stat-bottom">
            Veículos e equipamentos ativos
            <ArrowUpRight size={16} />
          </div>
        </button>
        <button className="stat-card" onClick={() => navigate('manutencoes')}>
          <div className="stat-top">
            <span>Manutenções registradas</span>
            <Wrench className="purple-text" size={21} />
          </div>
          <strong>{maintenance.length.toLocaleString('pt-BR')}</strong>
          <div className="stat-bottom">
            Serviços no histórico disponível
            <ArrowUpRight size={16} />
          </div>
        </button>
        <button className="stat-card" onClick={() => navigate('relatorios')}>
          <div className="stat-top">
            <span>Custos de manutenção</span>
            <Wallet className="green-text" size={21} />
          </div>
          <strong className="stat-money">{money(totalCost)}</strong>
          <div className="stat-bottom">
            Total dos envios disponíveis
            <ArrowUpRight size={16} />
          </div>
        </button>
      </div>
      <div className="section-heading">
        <h2>Acesso rápido</h2>
        <span>O que você precisa fazer hoje?</span>
      </div>
      <div className="quick-grid">
        {[
          {
            title: 'Registro de equipes',
            desc: 'Equipes, responsáveis e veículos por contrato.',
            icon: Users,
            page: 'equipes',
            color: 'orange',
          },
          {
            title: 'Manutenções',
            desc: 'Acompanhe serviços e custos da sua frota.',
            icon: Wrench,
            page: 'manutencoes',
            color: 'blue',
          },
          {
            title: 'Histórico de envios',
            desc: 'Consulte e gerencie os registros enviados.',
            icon: Clock3,
            page: 'historico',
            color: 'purple',
          },
        ].map((card) => (
          <button className="quick-card" key={card.page} onClick={() => navigate(card.page)}>
            <span className={`quick-icon ${card.color}`}>
              <card.icon size={23} />
            </span>
            <ArrowUpRight className="quick-arrow" size={19} />
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </button>
        ))}
      </div>
      <div className="overview-middle">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Equipes por dia</h2>
              <p>Alocações nos últimos 7 dias</p>
            </div>
            <span className="badge">
              <CalendarDays size={13} />
              Últimos 7 dias
            </span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={days.map((d, i) => `${dateLabel(d)}: ${counts[i]} equipes`).join('; ')}
          >
            {days.map((d, i) => (
              <button
                key={d}
                className={`bar-column ${d === today() ? 'today' : ''}`}
                onClick={() => navigate('equipes')}
                title={`${dateLabel(d)}: ${counts[i]} equipes`}
              >
                <span className="bar-area">
                  <span className="bar-value">{counts[i]}</span>
                  <span
                    className="bar"
                    style={{ height: `${Math.max(3, (counts[i] / max) * 128)}px` }}
                  />
                </span>
                <span>{dateLabel(d, { weekday: 'short' }).replace('.', '')}</span>
                <small>
                  {d.slice(8)}/{d.slice(5, 7)}
                </small>
              </button>
            ))}
          </div>
          <div className="panel-bottom">
            <span>
              <span className="orange-dot" /> Equipes registradas
            </span>
            <button className="text-button" onClick={() => navigate('equipes')}>
              Explorar por dia <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section className="panel contract-overview">
          <div className="panel-heading">
            <div>
              <h2>Distribuição por contrato</h2>
              <p>Equipes no histórico disponível</p>
            </div>
            <MapPin size={19} className="muted-text" />
          </div>
          {contracts.length ? (
            <div className="contract-bars">
              {contracts.map((c, i) => (
                <div key={c.name}>
                  <div>
                    <span>
                      <i
                        style={{
                          background: ['#ff6200', '#e4934c', '#488cb1', '#6886bb', '#7e8898'][i],
                        }}
                      />
                      {c.name}
                    </span>
                    <strong>
                      {c.count}
                      <small>equipes</small>
                    </strong>
                  </div>
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${(c.count / Math.max(1, teamCount)) * 100}%`,
                        background: ['#ff6200', '#e4934c', '#488cb1', '#6886bb', '#7e8898'][i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Os contratos aparecerão após os primeiros registros." />
          )}
          <div className="panel-bottom">
            <span>{new Set(regs.map((r) => r.contrato)).size} contratos com registros</span>
            <button className="text-button" onClick={() => navigate('contratos')}>
              Ver contratos <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Últimos envios</h2>
            <p>As movimentações mais recentes da operação</p>
          </div>
          <button className="text-button" onClick={() => navigate('historico')}>
            Ver histórico <ArrowRight size={15} />
          </button>
        </div>
        {recent.length ? (
          <div className="recent-list">
            {recent.map((item) => (
              <button key={item.id} onClick={() => onView(item)}>
                <span className={`recent-icon ${item.tipo === 'registro' ? 'orange' : 'blue'}`}>
                  {item.tipo === 'registro' ? <ClipboardList size={19} /> : <Wrench size={19} />}
                </span>
                <span>
                  <strong>
                    {item.tipo === 'registro'
                      ? 'Registro de equipes'
                      : (item.detalhes[0]?.servico ?? 'Manutenção')}
                  </strong>
                  <small>
                    {item.contrato} ·{' '}
                    {item.tipo === 'registro'
                      ? `${item.detalhes.length} equipes`
                      : item.placas.join(', ')}
                  </small>
                </span>
                <span className="recent-end">
                  <strong>{item.custo !== null ? money(item.custo) : dateLabel(item.data)}</strong>
                  <small>
                    Enviado em{' '}
                    {dateLabel(
                      new Date(item.created_at).toLocaleDateString('en-CA', {
                        timeZone: 'America/Sao_Paulo',
                      }),
                    )}
                  </small>
                </span>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
function ChevronRightIcon() {
  return <ArrowUpRight size={17} className="muted-text" />;
}
