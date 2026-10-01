import { useEffect, useRef, useState } from 'react';
import { KeyRound, Plus, Search } from 'lucide-react';
import { z } from 'zod';
import { adminUserSchema, type AdminUser } from '../domain/admin';
import { matches } from '../domain/rules';
import { api, errorMessage } from '../lib/api';
import { CreateUserForm, ResetPasswordForm } from './AdminForms';
import { Empty, Spinner } from './ui';

export function UserManagement({
  currentId,
  syncedAt,
  demo,
  onNotice,
  onOwnPasswordChanged,
}: {
  currentId: string;
  syncedAt: string;
  demo: boolean;
  onNotice: (message: string) => void;
  onOwnPasswordChanged: () => void;
}) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [dialog, setDialog] = useState<AdminUser | 'create' | null>(null);
  const requestId = useRef(0);
  useEffect(() => {
    const id = ++requestId.current;
    setError('');
    void api('/admin/users')
      .then((value) => {
        if (id === requestId.current) setUsers(z.array(adminUserSchema).parse(value));
      })
      .catch((error) => {
        if (id === requestId.current) setError(errorMessage(error));
      });
    return () => {
      requestId.current++;
    };
  }, [syncedAt, retry]);
  const visible = (users ?? [])
    .filter((u) =>
      matches(
        `${u.nome} ${u.sobrenome} ${u.login} ${u.perfil === 'admin' ? 'Administrador' : 'Funcionário'}`,
        search,
      ),
    )
    .sort((a, b) => `${a.nome} ${a.sobrenome}`.localeCompare(`${b.nome} ${b.sobrenome}`, 'pt-BR'));
  return (
    <>
      <div className="catalog-toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Pesquisar usuários"
            placeholder="Pesquisar por nome, usuário ou perfil…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="badge">{visible.length} usuários</span>
        <button className="button primary" onClick={() => setDialog('create')}>
          <Plus size={17} />
          Novo usuário
        </button>
      </div>
      <p className="catalog-note">
        As senhas atuais são protegidas e não podem ser consultadas. Como administrador, você pode
        definir uma nova senha sem código de recuperação.
      </p>
      {demo && (
        <p className="catalog-note">
          Demonstração: contas e alterações são temporárias e não criam acessos reais.
        </p>
      )}
      {error && (
        <div className="admin-error" role="alert">
          {error}{' '}
          <button className="text-button" onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {users === null && !error ? (
        <Spinner label="Carregando usuários…" />
      ) : (
        users !== null &&
        (!visible.length ? (
          <Empty
            title="Nenhum usuário encontrado"
            text="Ajuste a pesquisa ou crie uma nova conta."
          />
        ) : (
          <div className="table-wrap admin-users-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>
                        {user.nome} {user.sobrenome}
                      </strong>
                      {user.id === currentId && <small className="user-self">Sua conta</small>}
                    </td>
                    <td>{user.login}</td>
                    <td>{user.perfil === 'admin' ? 'Administrador' : 'Funcionário'}</td>
                    <td>
                      <span className={`badge ${user.ativo ? 'green' : ''}`}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="button secondary"
                        aria-label={`Alterar senha de ${user.login}`}
                        onClick={() => setDialog(user)}
                      >
                        <KeyRound size={15} />
                        Alterar senha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      {dialog === 'create' && (
        <CreateUserForm
          onClose={() => setDialog(null)}
          onSaved={(user) => {
            requestId.current++;
            setUsers((old) => [...(old ?? []).filter((u) => u.id !== user.id), user]);
            setSearch('');
            setDialog(null);
            onNotice('Usuário criado com sucesso.');
            setRetry((v) => v + 1);
          }}
        />
      )}
      {dialog && dialog !== 'create' && (
        <ResetPasswordForm
          user={dialog}
          self={dialog.id === currentId}
          onClose={() => setDialog(null)}
          onSaved={(reauthenticate) => {
            setDialog(null);
            if (reauthenticate) onOwnPasswordChanged();
            else onNotice(`Senha de ${dialog.login} alterada com sucesso.`);
          }}
        />
      )}
    </>
  );
}
