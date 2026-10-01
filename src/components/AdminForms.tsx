import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { z } from 'zod';
import {
  adminUserSchema,
  catalogSchemas,
  createUserSchema,
  passwordSchema,
  type AdminUser,
  type CatalogKind,
} from '../domain/admin';
import { api, errorMessage } from '../lib/api';
import { Field, Modal } from './ui';

const validationMessage = (error: unknown) =>
  error instanceof z.ZodError
    ? (error.issues[0]?.message ?? 'Verifique os campos.')
    : errorMessage(error);
export const catalogLabels = {
  veiculos: 'Novo veículo',
  funcionarios: 'Novo funcionário',
  contratos: 'Novo contrato',
};

export function CatalogForm({
  kind,
  onClose,
  onSaved,
}: {
  kind: CatalogKind;
  onClose: () => void;
  onSaved: (item: unknown) => void;
}) {
  const [value, setValue] = useState({ nome: '', placa: '', modelo: '', tipo: 'veiculo' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (field: keyof typeof value, text: string) =>
    setValue((old) => ({ ...old, [field]: text }));
  const close = () => {
    if (
      !busy &&
      (!Object.entries(value).some(([key, v]) => key !== 'tipo' && v) ||
        window.confirm('Descartar o cadastro não salvo?'))
    )
      onClose();
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try {
      const input = catalogSchemas[kind].parse(value);
      setBusy(true);
      const item = await api<unknown>(`/admin/catalogs/${kind}`, 'POST', input);
      onSaved(item);
    } catch (error) {
      setError(validationMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={catalogLabels[kind]}
      subtitle="O cadastro ficará disponível no web e no Hashi App."
      onClose={close}
      busy={busy}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <fieldset className="form-fieldset form-grid" disabled={busy}>
            {kind === 'veiculos' ? (
              <>
                <Field
                  label="Placa / identificação"
                  hint="Equipamentos podem usar a identificação da operação."
                >
                  <input
                    aria-label="Placa / identificação"
                    value={value.placa}
                    onChange={(e) => change('placa', e.target.value.toUpperCase())}
                    maxLength={30}
                    required
                    autoFocus
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    aria-label="Tipo"
                    value={value.tipo}
                    onChange={(e) => change('tipo', e.target.value)}
                  >
                    <option value="veiculo">Veículo</option>
                    <option value="equipamento">Equipamento</option>
                  </select>
                </Field>
                <Field label="Modelo">
                  <input
                    value={value.modelo}
                    onChange={(e) => change('modelo', e.target.value)}
                    maxLength={150}
                    required
                  />
                </Field>
              </>
            ) : (
              <Field
                label={kind === 'funcionarios' ? 'Nome completo' : 'Nome do contrato'}
                hint={
                  kind === 'funcionarios'
                    ? 'Para criar uma conta de acesso, use a aba Usuários.'
                    : undefined
                }
              >
                <input
                  aria-label={kind === 'funcionarios' ? 'Nome completo' : 'Nome do contrato'}
                  value={value.nome}
                  onChange={(e) => change('nome', e.target.value)}
                  maxLength={200}
                  required
                  autoFocus
                />
              </Field>
            )}
          </fieldset>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="button secondary" onClick={close} disabled={busy}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            <Save size={16} />
            {busy ? 'Salvando…' : 'Salvar cadastro'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordFields({
  password,
  confirm,
  onPassword,
  onConfirm,
}: {
  password: string;
  confirm: string;
  onPassword: (v: string) => void;
  onConfirm: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Field label="Nova senha" hint="Pelo menos 12 caracteres; até 72 bytes.">
        <div className="password-field">
          <input
            aria-label="Nova senha"
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            className="icon-button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>
      <Field label="Confirmar nova senha">
        <input
          type={visible ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => onConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>
    </>
  );
}

export function CreateUserForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}) {
  const [value, setValue] = useState({
    nome: '',
    sobrenome: '',
    login: '',
    perfil: 'funcionario',
    password: '',
  });
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (field: keyof typeof value, text: string) =>
    setValue((old) => ({ ...old, [field]: text }));
  const close = () => {
    if (
      !busy &&
      (!Object.entries(value).some(([key, v]) => key !== 'perfil' && v) ||
        window.confirm('Descartar o usuário não salvo?'))
    )
      onClose();
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try {
      const input = createUserSchema.parse(value);
      if (input.password !== confirm) throw new Error('As senhas não coincidem.');
      setBusy(true);
      const user = adminUserSchema.parse(await api('/admin/users', 'POST', input));
      setValue({ ...value, password: '' });
      setConfirm('');
      onSaved(user);
    } catch (error) {
      setError(validationMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Novo usuário"
      subtitle="A conta usará o mesmo acesso no web e no Hashi App."
      onClose={close}
      busy={busy}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <fieldset className="form-fieldset form-grid" disabled={busy}>
            <Field label="Nome">
              <input
                value={value.nome}
                onChange={(e) => change('nome', e.target.value)}
                maxLength={100}
                required
                autoFocus
              />
            </Field>
            <Field label="Sobrenome">
              <input
                value={value.sobrenome}
                onChange={(e) => change('sobrenome', e.target.value)}
                maxLength={100}
                required
              />
            </Field>
            <Field label="Usuário" hint="De 3 a 40 letras, números ou _. Comece por uma letra.">
              <input
                aria-label="Usuário"
                value={value.login}
                onChange={(e) => change('login', e.target.value.toLowerCase())}
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="off"
                maxLength={40}
                required
              />
            </Field>
            <Field label="Perfil de acesso">
              <select
                aria-label="Perfil de acesso"
                value={value.perfil}
                onChange={(e) => change('perfil', e.target.value)}
              >
                <option value="funcionario">Funcionário</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            <PasswordFields
              password={value.password}
              confirm={confirm}
              onPassword={(v) => change('password', v)}
              onConfirm={setConfirm}
            />
          </fieldset>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="button secondary" disabled={busy} onClick={close}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            <Save size={16} />
            {busy ? 'Criando…' : 'Criar usuário'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ResetPasswordForm({
  user,
  self,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  self: boolean;
  onClose: () => void;
  onSaved: (reauthenticate: boolean) => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try {
      passwordSchema.parse(password);
      if (password !== confirm) throw new Error('As senhas não coincidem.');
      setBusy(true);
      const result = await api<{ reauthenticate: boolean }>(
        `/admin/users/${user.id}/password`,
        'POST',
        { password },
      );
      setPassword('');
      setConfirm('');
      onSaved(result.reauthenticate);
    } catch (error) {
      setError(validationMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const close = () => {
    if (!busy && (!(password || confirm) || window.confirm('Descartar a nova senha não salva?')))
      onClose();
  };
  return (
    <Modal
      title="Alterar senha"
      subtitle={`${user.nome} ${user.sobrenome} · ${user.login}`}
      onClose={close}
      busy={busy}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <p>
            A nova senha será usada no web e no Hashi App. As sessões abertas dessa conta serão
            encerradas.
          </p>
          {self && <p>Você está alterando a sua senha e precisará entrar novamente após salvar.</p>}
          <fieldset className="form-fieldset form-grid" disabled={busy}>
            <PasswordFields
              password={password}
              confirm={confirm}
              onPassword={setPassword}
              onConfirm={setConfirm}
            />
          </fieldset>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="button secondary" disabled={busy} onClick={close}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy}>
            <Save size={16} />
            {busy ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
