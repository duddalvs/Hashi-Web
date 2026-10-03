import { useEffect, useState } from 'react';
import { Search, Truck, Users, MapPin, Plus } from 'lucide-react';
import { referenceSchema, vehicleSchema, type Bootstrap, type Catalogs } from '../domain/models';
import type { CatalogKind } from '../domain/admin';
import { CatalogForm, catalogLabels } from './AdminForms';
import { matches } from '../domain/rules';
import { Empty } from './ui';
import { api, errorMessage } from '../lib/api';
import { crlvListSchema, type Crlv } from '../domain/crlv';
import { VehicleCrlv } from './VehicleCrlv';
export function Catalog({
  page,
  data,
  onCreated,
}: {
  page: CatalogKind;
  data: Bootstrap;
  onCreated: (catalogs: Catalogs) => void;
}) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const vehicles = page === 'veiculos';
  const [documents, setDocuments] = useState<Crlv[]>([]);
  const [loadingCrlv, setLoadingCrlv] = useState(vehicles);
  const [crlvError, setCrlvError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!vehicles) return;
    let cancelled = false;
    setLoadingCrlv(true);
    setCrlvError('');
    api<unknown>('/vehicles/crlv')
      .then((result) => {
        if (!cancelled) setDocuments(crlvListSchema.parse(result));
      })
      .catch((error) => {
        if (!cancelled) setCrlvError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoadingCrlv(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicles, retry, data.syncedAt]);
  const people = page === 'funcionarios';
  const rows = vehicles
    ? data.catalogs.vehicles.map((v) => ({
        id: v.id,
        title: v.placa,
        subtitle: v.modelo,
        type: v.tipo === 'equipamento' ? 'Equipamento' : 'Veículo',
      }))
    : (people ? data.catalogs.employees : data.catalogs.contracts).map((r) => ({
        id: r.id,
        title: r.nome,
        subtitle: people ? 'Responsável / motorista' : 'Contrato operacional',
        type: people ? 'Funcionário' : 'Contrato',
      }));
  const visible = rows.filter((r) => matches(`${r.title} ${r.subtitle} ${r.type}`, search));
  const Icon = vehicles ? Truck : people ? Users : MapPin;
  return (
    <>
      <div className="catalog-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Pesquisar catálogo"
            placeholder={vehicles ? 'Pesquisar por placa, modelo ou tipo…' : 'Pesquisar por nome…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="badge">
          {visible.length} {vehicles ? 'cadastros' : 'cadastros ativos'}
        </span>
        {data.profile.perfil === 'admin' && (
          <button className="button primary" onClick={() => setCreating(true)}>
            <Plus size={17} />
            {catalogLabels[page]}
          </button>
        )}
      </div>
      <p className="catalog-note">
        Catálogo compartilhado com o Hashi App.{' '}
        {people
          ? 'As pessoas deste catálogo são selecionadas nas equipes e manutenções.'
          : 'Os dados são atualizados a partir do banco da operação.'}
      </p>
      {vehicles && crlvError && (
        <div className="crlv-error" role="alert">
          <span>{crlvError}</span>
          <button className="button secondary" onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {!visible.length ? (
        <Empty
          title="Nenhum cadastro encontrado"
          text="Ajuste a pesquisa para encontrar um cadastro."
        />
      ) : (
        <div className="catalog-grid">
          {visible.map((row) => (
            <article key={row.id} className="catalog-card">
              <div className="catalog-card-top">
                <span className="catalog-icon">
                  <Icon size={21} />
                </span>
                {!vehicles && (
                  <span className="badge green">
                    <span className="positive-dot" />
                    Ativo
                  </span>
                )}
              </div>
              <h3 className={vehicles ? 'plate-title' : ''}>{row.title}</h3>
              <p>{row.subtitle}</p>
              {vehicles && (
                <VehicleCrlv
                  vehicleId={row.id}
                  plate={row.title}
                  equipment={row.type === 'Equipamento'}
                  documents={documents.filter((doc) => doc.veiculo_id === row.id)}
                  loading={loadingCrlv}
                  failed={!!crlvError}
                />
              )}
              <div className="catalog-card-bottom">
                <span>{row.type}</span>
                <small>ID {row.id}</small>
              </div>
            </article>
          ))}
        </div>
      )}
      {creating && (
        <CatalogForm
          kind={page}
          onClose={() => setCreating(false)}
          onSaved={(item) => {
            const catalogs = { ...data.catalogs };
            if (page === 'veiculos')
              catalogs.vehicles = [...catalogs.vehicles, vehicleSchema.parse(item)].sort((a, b) =>
                a.placa.localeCompare(b.placa),
              );
            else if (page === 'funcionarios')
              catalogs.employees = [
                ...catalogs.employees,
                { ...referenceSchema.parse(item), is_status: false },
              ].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
            else
              catalogs.contracts = [...catalogs.contracts, referenceSchema.parse(item)].sort(
                (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
              );
            setSearch('');
            setCreating(false);
            onCreated(catalogs);
          }}
        />
      )}
    </>
  );
}
