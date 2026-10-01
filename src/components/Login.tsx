import { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { api, errorMessage, RequestError } from '../lib/api';
import { Brand, Field } from './ui';
export function Login({
  onLogin,
  demo,
  notice,
}: {
  onLogin: () => Promise<void>;
  demo: boolean;
  notice: string;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<'login' | 'code' | 'reset'>('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (stage === 'login') {
        await api('/login', 'POST', { username, password });
        setPassword('');
        await onLogin();
      } else if (stage === 'code') {
        await api('/recovery/validate', 'POST', { username, code });
        setCode('');
        setPassword('');
        setStage('reset');
      } else {
        if (password !== confirm) throw new Error('As senhas devem ser iguais.');
        if (password.length < 12 || new TextEncoder().encode(password).length > 72)
          throw new Error('Use pelo menos 12 caracteres, com limite de 72 bytes.');
        await api('/recovery/reset', 'POST', { password });
        setPassword('');
        setConfirm('');
        setStage('login');
        setSuccess('Senha atualizada. Entre com a nova senha.');
      }
    } catch (err) {
      setError(errorMessage(err));
      if (stage === 'reset' && err instanceof RequestError && err.status === 401) {
        setStage('code');
        setPassword('');
        setConfirm('');
      }
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    setBusy(true);
    setError('');
    try {
      await api('/demo', 'POST');
      await onLogin();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-story-main">
          <div className="eyebrow">
            <span className="orange-line" /> GESTÃO DE FROTA
          </div>
          <h1>
            Cada equipe.
            <br />
            Cada veículo.
            <br />
            <span>Tudo conectado.</span>
          </h1>
          <p>Uma visão clara da sua operação, do primeiro registro ao último detalhe.</p>
          <div className="login-features">
            <span>
              <Users size={19} /> Equipes e contratos
            </span>
            <span>
              <Truck size={19} /> Frota organizada
            </span>
            <span>
              <Wrench size={19} /> Manutenção e custos
            </span>
          </div>
        </div>
        <small>HASHIMOTO · SOLUÇÕES EM ENERGIA</small>
        <div className="login-grid-art" aria-hidden="true">
          <div />
          <div />
          <div />
        </div>
      </section>
      <section className="login-access">
        <div className="login-form-wrap">
          <div className="login-lock">
            <LockKeyhole size={25} />
          </div>
          <span className="eyebrow">BEM-VINDO AO HASHI</span>
          <h2>
            {stage === 'login'
              ? 'Sua operação começa aqui.'
              : stage === 'code'
                ? 'Recuperar seu acesso'
                : 'Defina sua nova senha'}
          </h2>
          <p>
            {stage === 'login'
              ? 'Entre com o mesmo usuário e senha do Hashi App.'
              : stage === 'code'
                ? 'Solicite o código de recuperação ao administrador e informe abaixo.'
                : 'Use pelo menos 12 caracteres na nova senha.'}
          </p>
          <form onSubmit={submit}>
            {stage !== 'reset' && (
              <Field label="Usuário">
                <input
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu nome de usuário"
                  required
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </Field>
            )}
            {stage === 'code' ? (
              <Field label="Código de recuperação">
                <input
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Código fornecido pelo administrador"
                  required
                />
              </Field>
            ) : (
              <>
                <Field label={stage === 'reset' ? 'Nova senha' : 'Senha'}>
                  <div className="password-field">
                    <input
                      type={visible ? 'text' : 'password'}
                      autoComplete={stage === 'reset' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setVisible(!visible)}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </Field>
                {stage === 'reset' && (
                  <Field label="Confirmar nova senha">
                    <input
                      type={visible ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                  </Field>
                )}
              </>
            )}
            {stage === 'login' && (
              <button
                type="button"
                className="text-button forgot"
                onClick={() => {
                  setStage('code');
                  setError('');
                  setPassword('');
                }}
              >
                Esqueceu sua senha?
              </button>
            )}
            {(error || notice) && (
              <div className="error-banner" role="alert">
                {error || notice}
              </div>
            )}
            {success && (
              <div className="success-banner" role="status">
                {success}
              </div>
            )}
            <button className="button primary login-submit" disabled={busy}>
              {busy
                ? 'Aguarde…'
                : stage === 'login'
                  ? 'Entrar no hashi'
                  : stage === 'code'
                    ? 'Validar código'
                    : 'Salvar nova senha'}
              <ArrowRight size={18} />
            </button>
          </form>
          {stage !== 'login' && (
            <button
              className="text-button"
              onClick={() => {
                setStage('login');
                setError('');
                setPassword('');
              }}
            >
              Voltar para o login
            </button>
          )}
          {demo && stage === 'login' && (
            <>
              <div className="login-divider">
                <span>CONHEÇA O SISTEMA</span>
              </div>
              <button className="button secondary demo-button" onClick={preview} disabled={busy}>
                Explorar demonstração <ArrowRight size={16} />
              </button>
              <small className="demo-disclaimer">
                Prévia com dados ilustrativos, separada da sua operação.
              </small>
            </>
          )}
          <div className="login-secure">
            <ShieldCheck size={16} />
            <span>Mesmo acesso. Mesmas permissões. Uma nova visão.</span>
          </div>
        </div>
        <small className="login-footer">hashi web · Gestão que acompanha sua equipe.</small>
      </section>
    </div>
  );
}
