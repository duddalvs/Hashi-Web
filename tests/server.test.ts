import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp, allHistory } from '../server/app';
import { ApiError, type Rpc } from '../server/rpc';
import { demoCatalogs } from '../server/demo';
import { today } from '../src/domain/rules';
const profile = {
  id: randomUUID(),
  nome: 'Teste',
  sobrenome: 'Local',
  login: 'test_user',
  ativo: true,
  perfil: 'funcionario',
};
async function harness(
  rpc: Rpc,
  work: (
    request: (
      path: string,
      method?: string,
      body?: unknown,
      cookie?: string,
      origin?: string,
    ) => Promise<Response>,
  ) => Promise<void>,
) {
  const origin = 'http://localhost:3999';
  const app = createApp({ rpc, origin, demo: true });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  const address = server.address() as { port: number };
  try {
    await work((path, method = 'GET', body, cookie, originOverride = origin) =>
      fetch(`http://127.0.0.1:${address.port}/api${path}`, {
        method,
        headers: {
          Origin: originOverride,
          'Content-Type': 'application/json',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(method !== 'GET' ? { body: JSON.stringify(body ?? {}) } : {}),
      }),
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

test('administration blocks missing sessions, employees and inactive administrators before writes', async () => {
  for (const denied of [profile, { ...profile, perfil: 'admin', ativo: false }]) {
    let writes = 0;
    await harness(
      async (name) => {
        if (name === 'meu_perfil') return denied;
        writes++;
        return null;
      },
      async (request) => {
        for (const [path, method] of [
          ['/admin/users', 'GET'],
          ['/admin/users', 'POST'],
          [`/admin/users/${profile.id}/password`, 'POST'],
          ['/admin/catalogs/veiculos', 'POST'],
          ['/admin/catalogs/funcionarios', 'POST'],
          ['/admin/catalogs/contratos', 'POST'],
        ]) {
          assert.equal((await request(path, method, {})).status, 401);
          assert.equal(
            (await request(path, method, {}, `hashi_session=${'a'.repeat(64)}`)).status,
            403,
          );
        }
        assert.equal(writes, 0);
      },
    );
  }
});

test('admin list and create return only profile fields; valid writes use the session token', async () => {
  const calls: { name: string; args?: Record<string, unknown> }[] = [];
  const user = {
    ...profile,
    created_at: new Date().toISOString(),
    password: 'never-expose',
    senha_hash: 'never-expose',
  };
  await harness(
    async (name, args) => {
      if (name === 'meu_perfil') return { ...profile, perfil: 'admin' };
      calls.push({ name, args });
      return name === 'web_listar_usuarios' ? [user] : user;
    },
    async (request) => {
      const cookie = `hashi_session=${'a'.repeat(64)}`;
      const listed = await request('/admin/users', 'GET', undefined, cookie);
      assert.equal(listed.status, 200);
      assert.ok(!(await listed.text()).includes('never-expose'));
      const created = await request(
        '/admin/users',
        'POST',
        {
          nome: '  Nome  Composto ',
          sobrenome: 'Teste',
          login: ' NOVO_USER ',
          perfil: 'funcionario',
          password: 'SenhaTeste2026!',
        },
        cookie,
      );
      assert.equal(created.status, 201);
      assert.ok(!(await created.text()).includes('never-expose'));
      assert.equal(calls[1].args?.p_usuario, 'novo_user');
      assert.equal(calls[1].args?.p_nome, 'Nome Composto');
      assert.equal(calls[1].args?.p_token, 'a'.repeat(64));
    },
  );
});

test('admin rejects invalid catalog and password data before mutation RPC', async () => {
  let writes = 0;
  await harness(
    async (name) => {
      if (name === 'meu_perfil') return { ...profile, perfil: 'admin' };
      writes++;
      return null;
    },
    async (request) => {
      const cookie = `hashi_session=${'a'.repeat(64)}`;
      for (const password of ['short', '😀'.repeat(11), '😀'.repeat(19)]) {
        assert.equal(
          (await request(`/admin/users/${profile.id}/password`, 'POST', { password }, cookie))
            .status,
          422,
        );
      }
      assert.equal(
        (await request('/admin/catalogs/contratos', 'POST', { nome: '  ' }, cookie)).status,
        422,
      );
      assert.equal(
        (
          await request(
            '/admin/catalogs/veiculos',
            'POST',
            { placa: '<script>', modelo: 'Teste', tipo: 'veiculo' },
            cookie,
          )
        ).status,
        422,
      );
      assert.equal((await request('/admin/catalogs/usuarios', 'POST', {}, cookie)).status, 422);
      assert.equal(
        (
          await request(
            '/admin/users',
            'POST',
            {
              nome: 'Nome',
              sobrenome: '',
              login: 'novo',
              perfil: 'admin',
              password: 'SenhaTeste2026!',
            },
            cookie,
          )
        ).status,
        422,
      );
      assert.equal(writes, 0);
    },
  );
});

test('password change clears own cookie only, requires no recovery code, and reports failed writes', async () => {
  let fail = false;
  await harness(
    async (name, args) => {
      if (name === 'meu_perfil') return { ...profile, perfil: 'admin' };
      assert.equal(name, 'web_definir_senha');
      assert.equal(args?.p_senha, 'SenhaTeste2026!');
      assert.equal(args?.p_token, 'a'.repeat(64));
      if (fail) throw new ApiError('Falha de conexão.', 503);
      return null;
    },
    async (request) => {
      const cookie = `hashi_session=${'a'.repeat(64)}`;
      const other = await request(
        `/admin/users/${randomUUID()}/password`,
        'POST',
        { password: 'SenhaTeste2026!' },
        cookie,
      );
      assert.deepEqual(await other.json(), { ok: true, reauthenticate: false });
      assert.equal(other.headers.get('set-cookie'), null);
      const own = await request(
        `/admin/users/${profile.id}/password`,
        'POST',
        { password: 'SenhaTeste2026!' },
        cookie,
      );
      assert.deepEqual(await own.json(), { ok: true, reauthenticate: true });
      assert.ok(own.headers.get('set-cookie')?.includes('Expires=Thu, 01 Jan 1970'));
      fail = true;
      assert.equal(
        (
          await request(
            `/admin/users/${profile.id}/password`,
            'POST',
            { password: 'SenhaTeste2026!' },
            cookie,
          )
        ).status,
        503,
      );
    },
  );
});

test('demo admin creates shared selectable references and users without remote calls or cross-session leaks', async () => {
  await harness(
    async () => {
      throw new Error('Remote RPC forbidden');
    },
    async (request) => {
      const cookie = (await request('/demo', 'POST')).headers.get('set-cookie')!.split(';')[0];
      const otherCookie = (await request('/demo', 'POST')).headers.get('set-cookie')!.split(';')[0];
      for (const [kind, value] of [
        ['funcionarios', { nome: 'Pessoa Nova' }],
        ['contratos', { nome: 'Contrato Novo' }],
        ['veiculos', { placa: 'web-123', modelo: 'Modelo Novo', tipo: 'equipamento' }],
      ] as const) {
        assert.equal((await request(`/admin/catalogs/${kind}`, 'POST', value, cookie)).status, 201);
        assert.equal((await request(`/admin/catalogs/${kind}`, 'POST', value, cookie)).status, 409);
      }
      const data = await (await request('/bootstrap', 'GET', undefined, cookie)).json();
      const catalogs = data.catalogs;
      const contract = catalogs.contracts.find((c: { nome: string }) => c.nome === 'Contrato Novo');
      const driver = catalogs.employees.find((c: { nome: string }) => c.nome === 'Pessoa Nova');
      const vehicle = catalogs.vehicles.find((c: { placa: string }) => c.placa === 'WEB-123');
      assert.ok(contract && driver && vehicle);
      assert.equal(
        (
          await request(
            '/entry/registro',
            'POST',
            {
              id: randomUUID(),
              date: today(),
              contractId: contract.id,
              teams: [{ responsavel_id: driver.id, veiculo_id: vehicle.id }],
            },
            cookie,
          )
        ).status,
        200,
      );
      const user = await request(
        '/admin/users',
        'POST',
        {
          nome: 'Pessoa',
          sobrenome: 'Nova',
          login: 'user_novo',
          perfil: 'funcionario',
          password: 'SenhaTeste2026!',
        },
        cookie,
      );
      assert.equal(user.status, 201);
      const created = await user.json();
      assert.equal(created.password, undefined);
      assert.equal(
        (
          await request(
            `/admin/users/${created.id}/password`,
            'POST',
            { password: 'NovaSenha2026!' },
            cookie,
          )
        ).status,
        200,
      );
      assert.ok(
        !(await (await request('/bootstrap', 'GET', undefined, otherCookie)).text()).includes(
          'Contrato Novo',
        ),
      );
      assert.ok(
        !(await (await request('/admin/users', 'GET', undefined, otherCookie)).text()).includes(
          'user_novo',
        ),
      );
    },
  );
});
test('authentication sets HttpOnly cookie, never exposes token and blocks missing sessions', async () => {
  await harness(
    async (name) =>
      name === 'autenticar_usuario'
        ? { token: 'a'.repeat(64), profile, expiresAt: new Date(Date.now() + 60000).toISOString() }
        : profile,
    async (request) => {
      assert.equal((await request('/bootstrap')).status, 401);
      const result = await request('/login', 'POST', {
        username: ' TEST_USER ',
        password: 'secret-for-test',
      });
      const cookie = result.headers.get('set-cookie')!;
      assert.ok(cookie.includes('HttpOnly'));
      assert.ok(cookie.includes('SameSite=Strict'));
      assert.equal(result.headers.get('cache-control'), 'no-store');
      assert.equal((await result.json()).token, undefined);
    },
  );
});
test('CSRF rejects a different or missing origin before RPC', async () => {
  await harness(
    async () => {
      throw new Error('Must not reach RPC');
    },
    async (request) => {
      assert.equal(
        (await request('/login', 'POST', {}, undefined, 'https://other.example')).status,
        403,
      );
      assert.equal((await request('/login', 'POST', {}, undefined, '')).status, 403);
    },
  );
});
test('employee cannot delete even when bypassing UI', async () => {
  let writes = 0;
  await harness(
    async (name) => {
      if (name === 'meu_perfil') return profile;
      writes++;
      return null;
    },
    async (request) => {
      const result = await request(
        `/entry/registro/${randomUUID()}`,
        'DELETE',
        {},
        `hashi_session=${'a'.repeat(64)}`,
      );
      assert.equal(result.status, 403);
      assert.equal(writes, 0);
    },
  );
});
test('server rejects duplicate teams before calling write RPC', async () => {
  let writes = 0;
  await harness(
    async (name) => {
      if (name === 'listar_catalogos') return demoCatalogs;
      writes++;
      return null;
    },
    async (request) => {
      const result = await request(
        '/entry/registro',
        'POST',
        {
          id: randomUUID(),
          date: today(),
          contractId: 1,
          teams: [
            { responsavel_id: 1, veiculo_id: 1 },
            { responsavel_id: 2, veiculo_id: 1 },
          ],
        },
        `hashi_session=${'a'.repeat(64)}`,
      );
      assert.equal(result.status, 422);
      assert.equal(writes, 0);
    },
  );
});
test('expired sessions clear cookie and fail with 401', async () => {
  await harness(
    async () => {
      throw new ApiError('Sessão expirada.', 401, '28000');
    },
    async (request) => {
      const result = await request(
        '/bootstrap',
        'GET',
        undefined,
        `hashi_session=${'a'.repeat(64)}`,
      );
      assert.equal(result.status, 401);
      assert.ok(result.headers.get('set-cookie')?.includes('Expires=Thu, 01 Jan 1970'));
    },
  );
});
test('logout failure remains visible; success revokes token and clears cookie', async () => {
  await harness(
    async (name) => {
      assert.equal(name, 'encerrar_sessao');
      throw new ApiError('Rede indisponível.', 503);
    },
    async (request) => {
      const result = await request('/logout', 'POST', {}, `hashi_session=${'a'.repeat(64)}`);
      assert.equal(result.status, 503);
      assert.equal(result.headers.get('set-cookie'), null);
    },
  );
  await harness(
    async () => null,
    async (request) => {
      const result = await request('/logout', 'POST', {}, `hashi_session=${'a'.repeat(64)}`);
      assert.equal(result.status, 200);
      assert.ok(result.headers.get('set-cookie')?.includes('Expires=Thu, 01 Jan 1970'));
    },
  );
});
test('complete history traverses more than 100 entries and deduplicates overlap', async () => {
  const ids = Array.from({ length: 205 }, () => randomUUID());
  const offsets: number[] = [];
  const history = await allHistory(async (_name, args) => {
    offsets.push(Number(args?.p_offset));
    return ids.slice(Number(args?.p_offset), Number(args?.p_offset) + 100).map((id) => ({
      id,
      tipo: 'registro',
      data: today(),
      contrato: 'A',
      placas: [],
      detalhes: [],
      custo: null,
      created_at: new Date().toISOString(),
    }));
  }, 'token');
  assert.equal(history.length, 205);
  assert.deepEqual(offsets, [0, 100, 200]);
});
test('demo supports CRUD without making any real RPC calls', async () => {
  await harness(
    async () => {
      throw new Error('Remote RPC forbidden');
    },
    async (request) => {
      const login = await request('/demo', 'POST');
      const cookie = login.headers.get('set-cookie')!.split(';')[0];
      const bootstrap = await (await request('/bootstrap', 'GET', undefined, cookie)).json();
      assert.equal(bootstrap.demo, true);
      assert.ok(bootstrap.history.length > 0);
      const id = randomUUID();
      const entry = {
        id,
        date: today(),
        contractId: 1,
        teams: [{ responsavel_id: 1, veiculo_id: 1 }],
      };
      assert.equal((await request('/entry/registro', 'POST', entry, cookie)).status, 200);
      const saved = await (await request(`/entry/registro/${id}`, 'GET', undefined, cookie)).json();
      assert.equal(saved.version, 1);
      assert.equal(
        (await request('/entry/registro', 'POST', { ...entry, version: 1, contractId: 2 }, cookie))
          .status,
        200,
      );
      assert.equal(
        (await request('/entry/registro', 'POST', { ...entry, version: 1, contractId: 3 }, cookie))
          .status,
        409,
      );
      assert.equal((await request(`/entry/registro/${id}`, 'DELETE', {}, cookie)).status, 200);
      assert.equal((await request(`/entry/registro/${id}`, 'GET', undefined, cookie)).status, 404);
    },
  );
});

test('recovery token stays in HttpOnly cookie; reset forwards it and clears both sessions', async () => {
  const calls: { name: string; args?: Record<string, unknown> }[] = [];
  await harness(
    async (name, args) => {
      calls.push({ name, args });
      return name === 'validar_codigo_recuperacao'
        ? { token: 'recovery-test-token' }
        : { ok: true };
    },
    async (request) => {
      const validated = await request('/recovery/validate', 'POST', {
        username: 'TEST_USER',
        code: 'test-code',
      });
      assert.equal(validated.status, 200);
      assert.equal((await validated.json()).token, undefined);
      const cookie = validated.headers.get('set-cookie')!;
      assert.ok(cookie.includes('HttpOnly'));
      const reset = await request(
        '/recovery/reset',
        'POST',
        { password: 'new-password-12' },
        cookie.split(';')[0],
      );
      assert.equal(reset.status, 200);
      assert.equal(calls[0].args?.p_usuario, 'test_user');
      assert.equal(calls[1].args?.p_token, 'recovery-test-token');
      assert.ok(reset.headers.getSetCookie().some((c) => c.startsWith('hashi_recovery=;')));
      assert.ok(reset.headers.getSetCookie().some((c) => c.startsWith('hashi_session=;')));
    },
  );
});
