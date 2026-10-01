import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  ListFilter,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sun,
  Users,
  Wallet,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Bootstrap, EntryType, HistoryItem } from './domain/models';
import { csv, emptyFilters, filterRows, type Filters as FilterValues } from './domain/filters';
import { dateLabel, money, timeLabel, today } from './domain/rules';
import { api, errorMessage, RequestError } from './lib/api';
import { Brand, Empty, Modal, Spinner } from './components/ui';
import { Login } from './components/Login';
import { EntryForm } from './components/EntryForm';
import { Filters } from './components/Filters';
import { RecordsTable, type RecordActions } from './components/RecordsTable';
import { DayView } from './components/DayView';
import { Overview } from './components/Overview';
import { Catalog } from './components/Catalog';
import { UserManagement } from './components/UserManagement';
import { catalogKindSchema } from './domain/admin';
import { navigation, useMenuPreferences } from './lib/navigation';
import { ServiceMenu } from './components/ServiceMenu';

type Dialog =
  | { kind: 'form'; type: EntryType; id?: string }
  | { kind: 'detail' | 'delete'; item: HistoryItem }
  | { kind: 'help' | 'profile' }
  | null;
export default function App() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(location.hash.slice(2) || 'inicio');
  const previousPage = useRef('inicio');
  const menuPreferences = useMenuPreferences(
    data?.profile.id ?? '',
    page,
    data?.profile.perfil === 'admin',
  );
  const [tab, setTab] = useState<'days' | 'filters'>('days');
  const [filters, setFilters] = useState<FilterValues>({ ...emptyFilters });
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deleting, setDeleting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [light, setLight] = useState(() => {
    try {
      return localStorage.getItem('hashi-theme') === 'light';
    } catch {
      return false;
    }
  });
  const dataRef = useRef(data);
  dataRef.current = data;
  const requestId = useRef(0);
  const refreshLock = useRef(false);
  const refresh = useCallback(async () => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    const id = ++requestId.current;
    setRefreshing(true);
    try {
      const next = await api<Bootstrap>('/bootstrap');
      if (id === requestId.current) {
        setData(next);
        setNotice('');
        setError('');
      }
    } catch (err) {
      if (id === requestId.current) {
        if (err instanceof RequestError && err.status === 401) setData(null);
        else setError(errorMessage(err));
      }
    } finally {
      refreshLock.current = false;
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    void api<{ demo: boolean }>('/config')
      .then((v) => setDemo(v.demo))
      .catch(() => {});
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const expired = () => {
      if (dataRef.current) setNotice('Sua sessão expirou. Entre novamente para continuar.');
      setData(null);
      setDialog(null);
    };
    const focus = () => {
      if (dataRef.current && Date.now() - Date.parse(dataRef.current.syncedAt) > 30000)
        void refresh();
    };
    window.addEventListener('hashi:expired', expired);
    window.addEventListener('focus', focus);
    return () => {
      window.removeEventListener('hashi:expired', expired);
      window.removeEventListener('focus', focus);
    };
  }, [refresh]);
  useEffect(() => {
    const route = () => {
      const next = location.hash.slice(2) || 'inicio';
      setPage(next);
      if (next !== 'menu' && next !== previousPage.current) setFilters({ ...emptyFilters });
    };
    window.addEventListener('hashchange', route);
    return () => window.removeEventListener('hashchange', route);
  }, []);
  useEffect(() => {
    if (page !== 'menu' && navigation.some((service) => service.key === page))
      previousPage.current = page;
    if (dataRef.current) {
      document.getElementById('conteudo')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [page]);
  useEffect(() => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
    try {
      localStorage.setItem('hashi-theme', light ? 'light' : 'dark');
    } catch {}
  }, [light]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const navigate = (next: string) => {
    location.hash = `/${next}`;
  };
  const meta = navigation.find((n) => n.key === page);
  const type =
    page === 'equipes'
      ? 'registro'
      : page === 'manutencoes' || page === 'relatorios'
        ? 'manutencao'
        : 'todos';
  const items = useMemo(
    () => (data?.history ?? []).filter((i) => type === 'todos' || i.tipo === type),
    [data, type],
  );
  const rows = useMemo(
    () => (data ? filterRows(items, filters, data.catalogs) : []),
    [items, filters, data],
  );
  const filteredItems = [...new Map(rows.map((r) => [r.item.id, r.item])).values()];
  const filteredCost = filteredItems.reduce((n, i) => n + (i.custo ?? 0), 0);
  const openDialog = (next: Dialog) => {
    setDialogError('');
    setDialog(next);
  };
  const actions: RecordActions = {
    admin: data?.profile.perfil === 'admin',
    onView: (item) => openDialog({ kind: 'detail', item }),
    onEdit: (item) => openDialog({ kind: 'form', type: item.tipo, id: item.id }),
    onDelete: (item) => openDialog({ kind: 'delete', item }),
  };
  async function logout() {
    setError('');
    try {
      await api('/logout', 'POST');
      requestId.current++;
      setData(null);
      setDialog(null);
      setNotice('');
      setFilters({ ...emptyFilters });
      navigate('inicio');
    } catch (err) {
      setError(errorMessage(err));
    }
  }
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([csv(rows)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `hashi-${page}-${today()}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast(`${rows.length} itens exportados.`);
  }
  async function remove() {
    if (dialog?.kind !== 'delete') return;
    setDeleting(true);
    setDialogError('');
    try {
      await api(`/entry/${dialog.item.tipo}/${dialog.item.id}`, 'DELETE');
      setDialog(null);
      setToast('Envio excluído.');
      await refresh();
    } catch (err) {
      setDialogError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }
  if (loading)
    return (
      <div className="initial-loading">
        <Brand />
        <Spinner label="Preparando sua operação…" />
      </div>
    );
  if (!data) return <Login demo={demo} onLogin={refresh} notice={notice || error} />;
  const countTeams = items.reduce((n, i) => n + i.detalhes.length, 0);
  const isList = ['equipes', 'manutencoes', 'historico', 'relatorios'].includes(page);
  return (
    <div className="app-layout">
      <a
        className="skip-link"
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault();
          const content = document.getElementById('conteudo');
          content?.focus();
          content?.scrollIntoView();
        }}
      >
        Pular para o conteúdo
      </a>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-navigation">
            <button
              className="icon-button menu-toggle"
              aria-label={page === 'menu' ? 'Fechar menu' : 'Abrir menu'}
              title={page === 'menu' ? 'Voltar para a tela anterior' : 'Menu de serviços'}
              aria-expanded={page === 'menu'}
              onClick={() => navigate(page === 'menu' ? previousPage.current : 'menu')}
            >
              {page === 'menu' ? <X size={21} /> : <Menu size={21} />}
            </button>
            <a
              className="topbar-brand"
              href="#/inicio"
              aria-label="hashi — Análise geral"
              title="Análise geral"
            >
              <Brand />
            </a>
            <span className="topbar-page">
              {page === 'menu' ? 'Menu de serviços' : (meta?.title ?? 'Página não encontrada')}
            </span>
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">
              <CalendarDays size={15} />
              {dateLabel(today(), { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="topbar-separator" />
            <button
              className="icon-button"
              aria-label={light ? 'Ativar tema escuro' : 'Ativar tema claro'}
              onClick={() => setLight(!light)}
            >
              {light ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              className="icon-button"
              aria-label="Ajuda"
              onClick={() => openDialog({ kind: 'help' })}
            >
              <CircleHelp size={19} />
            </button>
            <button
              className="topbar-avatar"
              aria-label="Minha conta"
              onClick={() => openDialog({ kind: 'profile' })}
            >
              {data.profile.nome[0]}
              {data.profile.sobrenome[0] ?? ''}
            </button>
            <button
              className="icon-button topbar-logout"
              onClick={() => void logout()}
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        {data.demo && (
          <div className="demo-banner">
            <span>
              <ShieldCheck size={14} />
              <strong>Modo demonstração</strong>
              <span>Dados ilustrativos. Alterações ficam apenas nesta sessão.</span>
            </span>
            <button onClick={() => void logout()}>
              Entrar com minha conta <ArrowRight size={13} />
            </button>
          </div>
        )}
        <main id="conteudo" data-page={page} tabIndex={-1}>
          {page !== 'menu' && (
            <div className="sync-line">
              <span>
                <span className="positive-dot" />
                {data.demo ? 'Prévia da operação' : 'Dados compartilhados com o Hashi App'}
              </span>
              <button onClick={() => void refresh()} disabled={refreshing}>
                <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
                {refreshing
                  ? 'Atualizando…'
                  : `Atualizado às ${new Date(data.syncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error} Os dados exibidos são da última atualização concluída.
              <button className="text-button" onClick={() => void refresh()}>
                Tentar novamente
              </button>
            </div>
          )}
          {page === 'menu' ? (
            <ServiceMenu
              admin={data.profile.perfil === 'admin'}
              {...menuPreferences}
              navigate={navigate}
            />
          ) : page === 'inicio' ? (
            <Overview
              data={data}
              navigate={navigate}
              onNew={() => openDialog({ kind: 'form', type: 'registro' })}
              onView={actions.onView}
            />
          ) : meta ? (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">{meta.group}</div>
                  <h1>{meta.title}</h1>
                  <p>{meta.desc}</p>
                </div>
                <div className="button-row">
                  {isList && (page !== 'equipes' || tab === 'filters') && (
                    <button
                      className="button secondary"
                      onClick={exportCsv}
                      disabled={!rows.length}
                    >
                      <ArrowDownToLine size={16} />
                      Exportar CSV
                    </button>
                  )}
                  {['equipes', 'manutencoes'].includes(page) && (
                    <button
                      className="button primary"
                      onClick={() =>
                        openDialog({
                          kind: 'form',
                          type: page === 'equipes' ? 'registro' : 'manutencao',
                        })
                      }
                    >
                      <Plus size={18} />
                      {page === 'equipes' ? 'Novo registro' : 'Nova manutenção'}
                    </button>
                  )}
                </div>
              </div>
              {page === 'equipes' && (
                <div className="tabs" role="tablist" aria-label="Visualização de equipes">
                  <button
                    role="tab"
                    aria-selected={tab === 'days'}
                    className={tab === 'days' ? 'active' : ''}
                    onClick={() => setTab('days')}
                  >
                    <CalendarDays size={17} />
                    Visão por dia<span className="tab-new">DINÂMICA</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === 'filters'}
                    className={tab === 'filters' ? 'active' : ''}
                    onClick={() => setTab('filters')}
                  >
                    <ListFilter size={17} />
                    Consulta com filtros<span className="count-pill">{countTeams}</span>
                  </button>
                </div>
              )}
              {page === 'equipes' && tab === 'days' ? (
                <DayView items={items} onView={actions.onView} />
              ) : isList ? (
                <>
                  <Filters
                    value={filters}
                    onChange={setFilters}
                    catalogs={data.catalogs}
                    items={items}
                    type={type}
                  />
                  <div className="results-summary">
                    <div>
                      <span className="summary-icon">
                        {type === 'registro' ? <Users size={18} /> : <ClipboardList size={18} />}
                      </span>
                      <strong>{filteredItems.length}</strong>
                      <span>envios encontrados</span>
                      <span className="summary-divider" />
                      <strong>
                        {type === 'registro'
                          ? rows.length
                          : new Set(rows.map((r) => r.detail.placa)).size}
                      </strong>
                      <span>{type === 'registro' ? 'equipes' : 'veículos'}</span>
                      <span className="summary-divider" />
                      <strong>{new Set(filteredItems.map((i) => i.contrato)).size}</strong>
                      <span>contratos</span>
                    </div>
                    {type !== 'registro' && (
                      <span className="summary-cost">
                        Custo total <strong>{money(filteredCost)}</strong>
                      </span>
                    )}
                    <span className="results-scope">
                      {data.profile.perfil === 'admin' ? 'Todos os usuários' : 'Meus envios'}
                    </span>
                  </div>
                  {page === 'relatorios' && (
                    <section className="report-grid">
                      {[...new Set(filteredItems.map((i) => i.contrato))].map((contract) => {
                        const entries = filteredItems.filter((i) => i.contrato === contract);
                        const cost = entries.reduce((n, i) => n + (i.custo ?? 0), 0);
                        return (
                          <article className="report-card" key={contract}>
                            <div>
                              <MapPin size={17} />
                              <span>{contract}</span>
                            </div>
                            <strong>{money(cost)}</strong>
                            <p>
                              {entries.length} manutenções ·{' '}
                              {filteredCost
                                ? ((cost / filteredCost) * 100).toFixed(1).replace('.', ',')
                                : '0'}
                              % do custo filtrado
                            </p>
                            <div className="progress-track">
                              <span
                                style={{
                                  width: `${filteredCost ? (cost / filteredCost) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </section>
                  )}
                  <RecordsTable rows={rows} type={type} {...actions} />
                  <p className="table-note">
                    {type === 'registro'
                      ? 'Uma linha por equipe. Editar um envio abre todas as equipes que pertencem a ele.'
                      : 'A data da operação e a data de envio são apresentadas separadamente.'}
                  </p>
                </>
              ) : page === 'usuarios' ? (
                data.profile.perfil === 'admin' ? (
                  <UserManagement
                    currentId={data.profile.id}
                    syncedAt={data.syncedAt}
                    demo={data.demo}
                    onNotice={setToast}
                    onOwnPasswordChanged={() => {
                      ++requestId.current;
                      setData(null);
                      setDialog(null);
                      setNotice('Sua senha foi alterada. Entre novamente com a nova senha.');
                    }}
                  />
                ) : (
                  <Empty
                    title="Acesso restrito"
                    text="Somente administradores podem gerenciar usuários."
                  />
                )
              ) : (
                <Catalog
                  key={page}
                  page={catalogKindSchema.parse(page)}
                  data={data}
                  onCreated={(catalogs) => {
                    setData((current) => (current ? { ...current, catalogs } : current));
                    setToast('Cadastro criado com sucesso.');
                  }}
                />
              )}
            </>
          ) : (
            <Empty
              title="Página não encontrada"
              text="Escolha uma opção no menu para continuar."
              action={
                <button className="button primary" onClick={() => navigate('inicio')}>
                  Ir para o início
                </button>
              }
            />
          )}
          <footer className="workspace-footer">
            <span>
              <strong>hashi</strong> · Gestão de frota
            </span>
            <span>Uma visão completa. Uma operação organizada.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
          <button className="icon-button" onClick={() => setToast('')} aria-label="Fechar aviso">
            <X size={15} />
          </button>
        </div>
      )}
      {dialog?.kind === 'form' && (
        <EntryForm
          type={dialog.type}
          id={dialog.id}
          catalogs={data.catalogs}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            setToast(
              dialog.id ? 'Alterações salvas com sucesso.' : 'Registro enviado com sucesso.',
            );
            void refresh();
          }}
        />
      )}
      {dialog?.kind === 'detail' && (
        <Modal
          title={
            dialog.item.tipo === 'registro'
              ? 'Detalhes do registro de equipes'
              : 'Detalhes da manutenção'
          }
          subtitle={dialog.item.contrato}
          onClose={() => setDialog(null)}
          wide
        >
          <div className="modal-body">
            <div className="detail-meta">
              <div>
                <span>Data da operação</span>
                <strong>{dateLabel(dialog.item.data)}</strong>
              </div>
              <div>
                <span>Enviado em</span>
                <strong>{timeLabel(dialog.item.created_at)}</strong>
              </div>
              <div>
                <span>{dialog.item.tipo === 'registro' ? 'Equipes' : 'Valor'}</span>
                <strong>
                  {dialog.item.tipo === 'registro'
                    ? dialog.item.detalhes.length
                    : money(dialog.item.custo ?? 0)}
                </strong>
              </div>
            </div>
            {dialog.item.detalhes.map((d, i) => (
              <section className="detail-team" key={i}>
                <div className="detail-team-heading">
                  <span className="team-number">{String(i + 1).padStart(2, '0')}</span>
                  <strong>{d.servico ?? `Equipe ${d.equipe ?? i + 1}`}</strong>
                  <span className="plate">{d.placa}</span>
                </div>
                <div className="detail-meta">
                  <div>
                    <span>Responsável / motorista</span>
                    <strong>{d.responsavel ?? 'Motorista não identificado'}</strong>
                  </div>
                  <div>
                    <span>Modelo</span>
                    <strong>{d.modelo}</strong>
                  </div>
                </div>
                {d.observacao && (
                  <p className="detail-note">
                    <span>Observação</span>
                    {d.observacao}
                  </p>
                )}
              </section>
            ))}
            <small className="record-id">ID do envio: {dialog.item.id}</small>
          </div>
          <div className="modal-footer">
            {actions.admin && (
              <button
                className="button danger-subtle"
                onClick={() => actions.onDelete(dialog.item)}
              >
                <Trash2 size={16} />
                Excluir envio
              </button>
            )}
            <button className="button primary" onClick={() => actions.onEdit(dialog.item)}>
              <Pencil size={16} />
              Editar envio
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'delete' && (
        <Modal
          title="Excluir este envio?"
          subtitle="Esta ação é definitiva e será refletida no Hashi App."
          onClose={() => setDialog(null)}
          busy={deleting}
        >
          <div className="modal-body">
            <p>
              Contrato <strong>{dialog.item.contrato}</strong> · {dateLabel(dialog.item.data)}
            </p>
            <p className="muted-text">
              {dialog.item.tipo === 'registro'
                ? `O registro e suas ${dialog.item.detalhes.length} equipes serão excluídos.`
                : `A manutenção de ${money(dialog.item.custo ?? 0)} será excluída.`}
            </p>
            {dialogError && (
              <div className="error-banner" role="alert">
                {dialogError}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="button secondary"
              onClick={() => setDialog(null)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button className="button danger" onClick={() => void remove()} disabled={deleting}>
              {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'profile' && (
        <Modal title="Minha conta" onClose={() => setDialog(null)}>
          <div className="modal-body">
            <div className="profile-card">
              <span className="avatar">{data.profile.nome[0]}</span>
              <h3>
                {data.profile.nome} {data.profile.sobrenome}
              </h3>
              <p>{data.profile.login}</p>
              <span className="badge orange">
                <ShieldCheck size={14} />
                {data.profile.perfil === 'admin' ? 'Administrador' : 'Funcionário'}
              </span>
            </div>
            <p className="muted-text">
              {data.profile.perfil === 'admin'
                ? 'Você pode criar, consultar, editar e excluir envios de todos os usuários.'
                : 'Você pode criar envios e consultar e editar os seus próprios registros.'}
            </p>
          </div>
          <div className="modal-footer">
            <button className="button secondary" onClick={() => void logout()}>
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </Modal>
      )}
      {dialog?.kind === 'help' && (
        <Modal
          title="Como usar o hashi"
          subtitle="Sua operação organizada, com os mesmos dados do Hashi App."
          onClose={() => setDialog(null)}
        >
          <div className="modal-body help-content">
            <div>
              <CalendarDays />
              <section>
                <h3>Encontre suas equipes por dia</h3>
                <p>
                  Em Registro de equipes, abra a aba Visão por dia. Selecione uma data ou expanda os
                  dias para visualizar os contratos e suas equipes.
                </p>
              </section>
            </div>
            <div>
              <ListFilter />
              <section>
                <h3>Combine os filtros</h3>
                <p>
                  Use data, contrato, motorista e veículo. Em Mais filtros, refine por modelo,
                  serviço, valores, quantidade de equipes e data do envio. O CSV acompanha os
                  filtros aplicados.
                </p>
              </section>
            </div>
            <div>
              <RefreshCw />
              <section>
                <h3>Mantenha os dados atualizados</h3>
                <p>
                  Use Atualizar no topo para buscar novos envios. Ao retornar à janela após 30
                  segundos, os dados são consultados novamente.
                </p>
              </section>
            </div>
            <div>
              <ShieldCheck />
              <section>
                <h3>Seu perfil acompanha você</h3>
                <p>
                  Administradores consultam e editam todos os envios e podem excluí-los.
                  Funcionários consultam e editam seus próprios envios.
                </p>
              </section>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
