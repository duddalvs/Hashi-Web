import { useEffect, useState } from 'react';
import { Plus, Trash2, Truck, Save, ArrowUpRight } from 'lucide-react';
import { z } from 'zod';
import type { Catalogs, Entry, EntryType, Maintenance, Registration, Team } from '../domain/models';
import { dateLabel, money, today, validateEntry } from '../domain/rules';
import { api, errorMessage, RequestError } from '../lib/api';
import { Field, Modal, Select, Spinner } from './ui';

function TeamFields({
  team,
  index,
  catalogs,
  entryId,
  onChange,
  remove,
  canRemove,
}: {
  team: Team;
  index: number;
  catalogs: Catalogs;
  entryId: string;
  onChange: (t: Team) => void;
  remove: () => void;
  canRemove: boolean;
}) {
  const [suggestion, setSuggestion] = useState<{ vehicleId: number; date: string } | null>(null);
  useEffect(() => {
    let active = true;
    setSuggestion(null);
    if (team.responsavel_id)
      void api<{ vehicleId: number; date: string } | null>(
        `/last-vehicle?driver=${team.responsavel_id}&exclude=${entryId}`,
      )
        .then((v) => {
          if (active) setSuggestion(v);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [team.responsavel_id, entryId]);
  const vehicle = catalogs.vehicles.find((v) => v.id === suggestion?.vehicleId);
  return (
    <section className="team-form">
      <div className="team-form-title">
        <span>
          <span className="team-number">{String(index + 1).padStart(2, '0')}</span>Equipe{' '}
          {index + 1}
        </span>
        <button
          type="button"
          className="icon-button"
          disabled={!canRemove}
          onClick={remove}
          aria-label={`Remover equipe ${index + 1}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="form-grid">
        <Select
          label={`Responsável da equipe ${index + 1}`}
          value={String(team.responsavel_id ?? '')}
          onChange={(v) => onChange({ ...team, responsavel_id: v ? Number(v) : null })}
          options={catalogs.employees.map((e) => ({ value: String(e.id), label: e.nome }))}
          placeholder="Selecione o responsável"
        />
        <Select
          label={`Veículo da equipe ${index + 1}`}
          value={String(team.veiculo_id ?? '')}
          onChange={(v) => onChange({ ...team, veiculo_id: v ? Number(v) : null })}
          options={catalogs.vehicles.map((v) => ({
            value: String(v.id),
            label: v.placa,
            description: v.modelo,
          }))}
          placeholder="Selecione a placa"
        />
      </div>
      {vehicle && suggestion && team.veiculo_id !== vehicle.id && (
        <button
          className="vehicle-suggestion"
          type="button"
          onClick={() => onChange({ ...team, veiculo_id: vehicle.id })}
        >
          <Truck size={15} />
          <span>
            Último veículo: <strong>{vehicle.placa}</strong> · {dateLabel(suggestion.date)}
          </span>
          <span>
            Usar veículo <ArrowUpRight size={14} />
          </span>
        </button>
      )}
    </section>
  );
}
export function EntryForm({
  type,
  id,
  catalogs,
  onClose,
  onSaved,
}: {
  type: EntryType;
  id?: string;
  catalogs: Catalogs;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<Entry>(() => {
    const common = { id: crypto.randomUUID(), date: today(), contractId: null };
    return type === 'registro'
      ? { ...common, teams: [{ responsavel_id: null, veiculo_id: null }] }
      : {
          ...common,
          typeId: null,
          driverId: null,
          driverUnidentified: false,
          vehicleId: null,
          costDigits: '',
          note: '',
        };
  });
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  async function load() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const entry = await api<Entry>(`/entry/${type}/${id}`);
      setValue(
        'driverId' in entry
          ? { ...entry, driverUnidentified: entry.driverId === null, note: entry.note ?? '' }
          : entry,
      );
      setDirty(false);
      setConflict(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [id, type]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);
  const change = (patch: Partial<Entry>) => {
    setValue((v) => ({ ...v, ...patch }));
    setDirty(true);
  };
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      validateEntry(type, value, catalogs);
      await api(`/entry/${type}`, 'POST', value);
      setDirty(false);
      onSaved();
    } catch (err) {
      setError(
        err instanceof z.ZodError
          ? err.issues
              .map((i) =>
                i.message.startsWith('Invalid')
                  ? 'Preencha todos os campos obrigatórios selecionando uma opção.'
                  : i.message,
              )
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(' ')
          : errorMessage(err),
      );
      setConflict(err instanceof RequestError && err.status === 409);
    } finally {
      setBusy(false);
    }
  }
  const maintenance = value as Maintenance;
  const registration = value as Registration;
  const selectedVehicle = catalogs.vehicles.find((v) => v.id === maintenance.vehicleId);
  const close = () => (dirty ? setDiscard(true) : onClose());
  return (
    <Modal
      title={`${id ? 'Editar' : 'Novo'} ${type === 'registro' ? 'registro de equipes' : 'registro de manutenção'}`}
      subtitle={
        id
          ? 'Atualize as informações do envio selecionado.'
          : 'Preencha os dados da operação. Todos os campos, exceto observação, são obrigatórios.'
      }
      onClose={close}
      wide
      busy={busy}
    >
      {loading ? (
        <Spinner />
      ) : (
        <form onSubmit={save}>
          <fieldset className="form-fieldset" disabled={busy}>
            <div className="modal-body">
              <div className="form-section-label">INFORMAÇÕES DO REGISTRO</div>
              <div className="form-grid">
                <Field label="Data">
                  <input
                    type="date"
                    required
                    max={today()}
                    value={value.date}
                    onChange={(e) => change({ date: e.target.value })}
                  />
                </Field>
                <Select
                  label="Contrato"
                  value={String(value.contractId ?? '')}
                  options={catalogs.contracts.map((c) => ({ value: String(c.id), label: c.nome }))}
                  onChange={(v) => change({ contractId: v ? Number(v) : null })}
                  placeholder="Selecione o contrato"
                />
              </div>
              {type === 'registro' ? (
                <>
                  <div className="form-section-heading">
                    <span className="form-section-label">EQUIPES DO DIA</span>
                    <span className="badge">{registration.teams.length} / 50 equipes</span>
                  </div>
                  {registration.teams.map((team, index) => (
                    <TeamFields
                      key={index}
                      team={team}
                      index={index}
                      catalogs={catalogs}
                      entryId={value.id}
                      onChange={(t) =>
                        change({
                          teams: registration.teams.map((old, i) => (i === index ? t : old)),
                        })
                      }
                      remove={() =>
                        change({ teams: registration.teams.filter((_, i) => i !== index) })
                      }
                      canRemove={registration.teams.length > 1}
                    />
                  ))}
                  <button
                    type="button"
                    className="button dashed"
                    disabled={registration.teams.length >= 50}
                    onClick={() =>
                      change({
                        teams: [...registration.teams, { responsavel_id: null, veiculo_id: null }],
                      })
                    }
                  >
                    <Plus size={17} />
                    Adicionar equipe
                  </button>
                  <p className="form-help">
                    Cada equipe contém um responsável e um veículo. Não repita pessoas ou veículos
                    neste envio.
                  </p>
                </>
              ) : (
                <>
                  <div className="form-section-label spaced">VEÍCULO E SERVIÇO</div>
                  <div className="form-grid">
                    <Select
                      label="Placa do veículo"
                      value={String(maintenance.vehicleId ?? '')}
                      onChange={(v) => change({ vehicleId: v ? Number(v) : null })}
                      options={catalogs.vehicles.map((v) => ({
                        value: String(v.id),
                        label: v.placa,
                        description: v.modelo,
                      }))}
                      placeholder="Selecione a placa"
                    />
                    <Field label="Modelo do veículo">
                      <input
                        value={selectedVehicle?.modelo ?? ''}
                        readOnly
                        placeholder="Preenchido pela placa"
                      />
                    </Field>
                    <Select
                      label="Motorista"
                      value={
                        maintenance.driverUnidentified
                          ? '__unknown'
                          : String(maintenance.driverId ?? '')
                      }
                      onChange={(v) =>
                        change({
                          driverId: v && v !== '__unknown' ? Number(v) : null,
                          driverUnidentified: v === '__unknown',
                        })
                      }
                      options={[
                        { value: '__unknown', label: 'Motorista não identificado' },
                        ...catalogs.employees.map((e) => ({ value: String(e.id), label: e.nome })),
                      ]}
                      placeholder="Selecione o motorista"
                    />
                    <Select
                      label="Tipo de manutenção"
                      value={String(maintenance.typeId ?? '')}
                      onChange={(v) => change({ typeId: v ? Number(v) : null })}
                      options={catalogs.maintenanceTypes.map((t) => ({
                        value: String(t.id),
                        label: t.nome,
                      }))}
                      placeholder="Selecione o serviço"
                    />
                  </div>
                  <Field label="Observação (opcional)">
                    <input
                      value={maintenance.note ?? ''}
                      onChange={(e) =>
                        change({ note: Array.from(e.target.value).slice(0, 40).join('') })
                      }
                      placeholder="Detalhe breve do serviço realizado"
                    />
                    <small className="counter">
                      {Array.from(maintenance.note ?? '').length}/40 caracteres
                    </small>
                  </Field>
                  <Field label="Valor da manutenção">
                    <input
                      inputMode="numeric"
                      value={
                        maintenance.costDigits === ''
                          ? ''
                          : money(Number(maintenance.costDigits) / 100)
                      }
                      placeholder="R$ 0,00"
                      onChange={(e) =>
                        change({
                          costDigits: e.target.value
                            .replace(/\D/g, '')
                            .replace(/^0+(?=\d)/, '')
                            .slice(0, 12),
                        })
                      }
                      required
                    />
                    <small>Zero é permitido para serviços sem custo.</small>
                  </Field>
                </>
              )}
              {error && (
                <div className="error-banner" role="alert">
                  {error}
                  {conflict && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        if (
                          window.confirm(
                            'Recarregar descarta as alterações deste formulário. Continuar?',
                          )
                        )
                          void load();
                      }}
                    >
                      Carregar versão atual
                    </button>
                  )}
                </div>
              )}
              {discard && (
                <div className="warning-banner" role="alert">
                  Há alterações não salvas.
                  <div className="button-row">
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => setDiscard(false)}
                    >
                      Continuar editando
                    </button>
                    <button type="button" className="button danger" onClick={onClose}>
                      Descartar alterações
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="button secondary" onClick={close}>
                Cancelar
              </button>
              <button className="button primary" disabled={busy || (!!id && !value.version)}>
                <Save size={17} />
                {busy ? 'Salvando…' : id ? 'Salvar alterações' : 'Salvar registro'}
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </Modal>
  );
}
