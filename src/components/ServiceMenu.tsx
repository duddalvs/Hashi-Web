import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock3,
  FolderOpen,
  Heart,
  Info,
  LayoutDashboard,
  LayoutGrid,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { matches } from '../domain/rules';
import { navigation, type Service } from '../lib/navigation';
import { Empty, Modal } from './ui';

const categories = [
  { key: 'Todos', title: 'Todos os serviços', icon: LayoutGrid },
  { key: 'PRINCIPAL', title: 'Principal', icon: LayoutDashboard },
  { key: 'OPERAÇÃO', title: 'Operação', icon: Truck },
  { key: 'CADASTROS', title: 'Cadastros', icon: FolderOpen },
  { key: 'GESTÃO', title: 'Gestão', icon: BarChart3 },
];

export function ServiceMenu({
  admin,
  favorites,
  recent,
  toggleFavorite,
  navigate,
}: {
  admin: boolean;
  favorites: string[];
  recent: string[];
  toggleFavorite: (key: string) => void;
  navigate: (key: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('Todos');
  const [info, setInfo] = useState<Service | null>(null);
  const services = navigation.filter((service) => service.key !== 'usuarios' || admin);
  const filtered = services.filter(
    (service) =>
      (group === 'Todos' || service.group === group) &&
      matches(`${service.title} ${service.desc} ${service.group}`, search),
  );
  const favoriteServices = filtered.filter((service) => favorites.includes(service.key));
  const otherServices = filtered.filter((service) => !favorites.includes(service.key));
  const recentServices = recent.flatMap(
    (key) => filtered.find((service) => service.key === key) ?? [],
  );
  function card(service: Service, recentCard = false) {
    const favorite = favorites.includes(service.key);
    return (
      <article className={`service-card${recentCard ? ' recent-service' : ''}`} key={service.key}>
        <a className="service-link" href={`#/${service.key}`} aria-label={service.title}>
          <service.icon size={32} aria-hidden="true" />
          <span className="service-category">{service.group}</span>
          <strong>{service.title}</strong>
        </a>
        <div className="service-actions">
          <button
            type="button"
            aria-label={`${favorite ? 'Remover' : 'Adicionar'} ${service.title} ${favorite ? 'dos' : 'aos'} favoritos`}
            aria-pressed={favorite}
            title={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            onClick={() => toggleFavorite(service.key)}
          >
            <Heart size={18} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            aria-label={`Sobre ${service.title}`}
            title={`Sobre ${service.title}`}
            onClick={() => setInfo(service)}
          >
            <Info size={17} />
          </button>
        </div>
      </article>
    );
  }
  return (
    <div className="service-menu" id="menu-servicos">
      <aside className="menu-sidebar" aria-label="Menu de categorias">
        <div className="menu-sidebar-content">
          <div className="menu-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar serviços"
              placeholder="Buscar um serviço…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="Limpar busca de serviços"
                onClick={() => setSearch('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <p className="menu-sidebar-label">Categorias de serviços</p>
          <nav className="menu-categories" aria-label="Categorias de serviços">
            {categories.map((category) => (
              <button
                key={category.key}
                className={category.key === group ? 'active' : ''}
                aria-pressed={category.key === group}
                onClick={() => setGroup(category.key)}
              >
                <category.icon size={18} aria-hidden="true" />
                <span>{category.title}</span>
                <ChevronRight className="category-chevron" size={14} aria-hidden="true" />
              </button>
            ))}
          </nav>
        </div>
      </aside>
      <div className="menu-content">
        <div className="menu-heading">
          <div>
            <h1>
              {group === 'Todos'
                ? 'Menu de serviços'
                : categories.find((category) => category.key === group)?.title}
            </h1>
            <p>
              {group === 'Todos'
                ? 'Escolha o que você precisa para sua operação.'
                : 'Selecione um serviço desta categoria para continuar.'}
            </p>
          </div>
        </div>
        <nav aria-label="Serviços">
          {favoriteServices.length > 0 && (
            <section className="service-section" aria-labelledby="favoritos-title">
              <h2 id="favoritos-title">
                <Heart size={20} fill="currentColor" /> Favoritos{' '}
                <span>({favoriteServices.length})</span>
              </h2>
              <div className="service-grid">{favoriteServices.map((service) => card(service))}</div>
            </section>
          )}
          {otherServices.length > 0 && (
            <section className="service-section" aria-labelledby="outros-title">
              <h2 id="outros-title">
                <LayoutGrid size={20} />{' '}
                {favoriteServices.length ? 'Outros serviços' : 'Todos os serviços'}{' '}
                <span>({otherServices.length})</span>
              </h2>
              <div className="service-grid">{otherServices.map((service) => card(service))}</div>
            </section>
          )}
          {filtered.length === 0 && (
            <Empty
              title="Nenhum serviço encontrado"
              text="Tente outro nome ou escolha uma categoria diferente."
              action={
                <button
                  className="button secondary"
                  onClick={() => {
                    setSearch('');
                    setGroup('Todos');
                  }}
                >
                  Limpar busca e categoria
                </button>
              }
            />
          )}
          {recentServices.length > 0 && (
            <section className="service-section" aria-labelledby="recentes-title">
              <h2 id="recentes-title">
                <Clock3 size={20} /> Vistos por último
              </h2>
              <div className="service-grid">
                {recentServices.map((service) => card(service, true))}
              </div>
            </section>
          )}
        </nav>
      </div>
      {info && (
        <Modal title={info.title} subtitle="Serviço hashi" onClose={() => setInfo(null)}>
          <div className="modal-body">
            <p>{info.desc}</p>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={() => navigate(info.key)}>
              Abrir serviço <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
