import express, { type ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { z } from 'zod';
import {
  catalogsSchema,
  historySchema,
  profileSchema,
  referenceSchema,
  vehicleSchema,
  type HistoryItem,
} from '../src/domain/models';
import { toRpc, validateEntry } from '../src/domain/rules';
import { ApiError, type Rpc } from './rpc';
import { createDemo } from './demo';
import {
  adminUserSchema,
  catalogKindSchema,
  catalogSchemas,
  createUserSchema,
  passwordSchema,
} from '../src/domain/admin';

export async function allHistory(rpc: Rpc, token: string) {
  const result = new Map<string, HistoryItem>();
  for (let offset = 0; offset < 100000; offset += 100) {
    const page = z.array(historySchema).parse(
      await rpc('buscar_historico', {
        p_token: token,
        p_busca: '',
        p_limite: 100,
        p_offset: offset,
        p_tipo: 'todos',
      }),
    );
    for (const item of page) result.set(item.id, item);
    if (page.length < 100) return [...result.values()];
  }
  throw new ApiError(
    'O volume exige uma consulta paginada no servidor. Não foi possível carregar o histórico completo.',
    422,
  );
}
export function createApp(options: {
  rpc: Rpc;
  origin: string;
  secure?: boolean;
  production?: boolean;
  demo?: boolean;
}) {
  const app = express();
  const demo = createDemo();
  const cookies = {
    httpOnly: true,
    secure: !!options.secure,
    sameSite: 'strict' as const,
    path: '/api',
  };
  const cookieName = 'hashi_session';
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: options.production
        ? {
            directives: {
              'script-src': ["'self'"],
              'connect-src': ["'self'"],
              'style-src': ["'self'", "'unsafe-inline'"],
              'upgrade-insecure-requests': options.secure ? [] : null,
            },
          }
        : false,
      strictTransportSecurity: options.secure ? undefined : false,
    }),
  );
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', (req, _res, next) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      (req.get('origin') !== options.origin || !req.is('application/json'))
    )
      return next(new ApiError('Origem da solicitação não autorizada.', 403));
    next();
  });
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  const rpcFor = (token: string): Rpc =>
    token.startsWith('demo-') && options.demo && !options.production ? demo.rpc : options.rpc;
  app.get('/api/config', (_req, res) => res.json({ demo: !!options.demo && !options.production }));
  app.post('/api/login', async (req, res) => {
    const { username, password } = z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z][a-z0-9_]{2,39}$/, 'Informe um usuário válido.'),
        password: z.string().min(1).max(1024),
      })
      .parse(req.body);
    const data = z
      .object({
        token: z.string().regex(/^[a-f0-9]{64}$/),
        expiresAt: z.string().refine((s) => Date.parse(s) > Date.now()),
        profile: profileSchema,
      })
      .parse(await options.rpc('autenticar_usuario', { p_usuario: username, p_senha: password }));
    if (!data.profile.ativo) throw new ApiError('Conta inativa.', 403);
    res
      .cookie(cookieName, data.token, { ...cookies, expires: new Date(data.expiresAt) })
      .json({ profile: data.profile });
  });
  app.post('/api/demo', (req, res) => {
    if (!options.demo || options.production) throw new ApiError('Recurso indisponível.', 404);
    const role = z.enum(['admin', 'funcionario']).default('admin').parse(req.body.role);
    const session = demo.start(role);
    res
      .cookie(cookieName, session.token, { ...cookies, maxAge: 3600000 })
      .json({ profile: session.profile });
  });
  app.post('/api/recovery/validate', async (req, res) => {
    const { username, code } = z
      .object({
        username: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z][a-z0-9_]{2,39}$/),
        code: z.string().trim().min(1).max(100),
      })
      .parse(req.body);
    const result = z
      .object({ token: z.string().min(1) })
      .parse(
        await options.rpc('validar_codigo_recuperacao', { p_usuario: username, p_codigo: code }),
      );
    res.cookie('hashi_recovery', result.token, { ...cookies, maxAge: 600000 }).json({ ok: true });
  });
  app.post('/api/recovery/reset', async (req, res) => {
    const { password } = z
      .object({
        password: z
          .string()
          .min(12, 'A senha deve ter pelo menos 12 caracteres.')
          .refine(
            (v) => Buffer.byteLength(v, 'utf8') <= 72,
            'A senha excede o limite de 72 bytes.',
          ),
      })
      .parse(req.body);
    if (!req.cookies.hashi_recovery) throw new ApiError('Valide o código novamente.', 401);
    await options.rpc('recuperar_senha', {
      p_token: req.cookies.hashi_recovery,
      p_senha: password,
    });
    res.clearCookie('hashi_recovery', cookies).clearCookie(cookieName, cookies).json({ ok: true });
  });
  app.use('/api', (req, res, next) => {
    const token = req.cookies[cookieName];
    if (
      typeof token !== 'string' ||
      !(
        /^[a-f0-9]{64}$/.test(token) ||
        (options.demo && !options.production && /^demo-[a-f0-9-]{36}$/.test(token))
      )
    )
      return next(new ApiError('Entre para acessar o hashi.', 401));
    res.locals.token = token;
    next();
  });
  app.use('/api/admin', async (_req, res, next) => {
    const token = res.locals.token as string;
    const profile = profileSchema.parse(await rpcFor(token)('meu_perfil', { p_token: token }));
    if (!profile.ativo || profile.perfil !== 'admin')
      throw new ApiError('Somente administradores podem gerenciar cadastros e usuários.', 403);
    res.locals.adminProfile = profile;
    next();
  });
  app.post('/api/admin/catalogs/:kind', async (req, res) => {
    const kind = catalogKindSchema.parse(req.params.kind);
    const value = catalogSchemas[kind].parse(req.body);
    const token = res.locals.token as string;
    const result = await rpcFor(token)('web_criar_cadastro', {
      p_token: token,
      p_tipo: kind,
      p_dados: value,
    });
    const item = kind === 'veiculos' ? vehicleSchema.parse(result) : referenceSchema.parse(result);
    res.status(201).json(item);
  });
  app.get('/api/admin/users', async (_req, res) => {
    const token = res.locals.token as string;
    res.json(
      z
        .array(adminUserSchema)
        .parse(await rpcFor(token)('web_listar_usuarios', { p_token: token })),
    );
  });
  app.post('/api/admin/users', async (req, res) => {
    const value = createUserSchema.parse(req.body);
    const token = res.locals.token as string;
    const result = await rpcFor(token)('web_criar_usuario', {
      p_token: token,
      p_usuario: value.login,
      p_nome: value.nome,
      p_sobrenome: value.sobrenome,
      p_perfil: value.perfil,
      p_senha: value.password,
    });
    res.status(201).json(adminUserSchema.parse(result));
  });
  app.post('/api/admin/users/:id/password', async (req, res) => {
    const id = z.uuid().parse(req.params.id);
    const { password } = z.object({ password: passwordSchema }).parse(req.body);
    const token = res.locals.token as string;
    await rpcFor(token)('web_definir_senha', {
      p_token: token,
      p_usuario_id: id,
      p_senha: password,
    });
    const reauthenticate = id === res.locals.adminProfile.id;
    if (reauthenticate) res.clearCookie(cookieName, cookies);
    res.json({ ok: true, reauthenticate });
  });
  app.get('/api/bootstrap', async (_req, res) => {
    const token = res.locals.token as string;
    const rpc = rpcFor(token);
    const [profile, catalogs, history] = await Promise.all([
      rpc('meu_perfil', { p_token: token }).then((v) => profileSchema.parse(v)),
      rpc('listar_catalogos', { p_token: token }).then((v) => catalogsSchema.parse(v)),
      allHistory(rpc, token),
    ]);
    if (!profile.ativo) throw new ApiError('Conta inativa.', 401);
    catalogs.employees = catalogs.employees
      .filter((e) => e.ativo && !e.is_status)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    catalogs.vehicles = catalogs.vehicles
      .filter((v) => v.ativo)
      .sort((a, b) => a.placa.localeCompare(b.placa));
    catalogs.contracts = catalogs.contracts
      .filter((c) => c.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    catalogs.maintenanceTypes = catalogs.maintenanceTypes.filter((c) => c.ativo);
    res.json({
      profile,
      catalogs,
      history,
      syncedAt: new Date().toISOString(),
      demo: token.startsWith('demo-'),
    });
  });
  app.post('/api/logout', async (_req, res) => {
    const token = res.locals.token as string;
    await rpcFor(token)('encerrar_sessao', { p_token: token });
    res.clearCookie(cookieName, cookies).json({ ok: true });
  });
  app.get('/api/entry/:type/:id', async (req, res) => {
    const type = z.enum(['registro', 'manutencao']).parse(req.params.type);
    const id = z.uuid().parse(req.params.id);
    const token = res.locals.token as string;
    const result = await rpcFor(token)('obter_envio', { p_token: token, p_id: id, p_tipo: type });
    if (!result) throw new ApiError('Envio não encontrado ou sem permissão.', 404);
    res.json(result);
  });
  app.get('/api/last-vehicle', async (req, res) => {
    const driver = z.coerce.number().int().positive().parse(req.query.driver);
    const exclude = z.uuid().parse(req.query.exclude);
    const token = res.locals.token as string;
    res.json(
      await rpcFor(token)('ultimo_veiculo_motorista', {
        p_token: token,
        p_motorista_id: driver,
        p_excluir_registro: exclude,
      }),
    );
  });
  app.post('/api/entry/:type', async (req, res) => {
    const type = z.enum(['registro', 'manutencao']).parse(req.params.type);
    const token = res.locals.token as string;
    const rpc = rpcFor(token);
    const catalogs = catalogsSchema.parse(await rpc('listar_catalogos', { p_token: token }));
    let value;
    try {
      value = validateEntry(type, req.body, catalogs);
    } catch (err) {
      if (err instanceof z.ZodError) throw err;
      throw new ApiError(
        err instanceof Error ? err.message : 'Verifique os campos preenchidos.',
        422,
      );
    }
    const call = toRpc(type, value);
    await rpc(call.name, { ...call.args, p_token: token });
    res.json({ ok: true });
  });
  app.delete('/api/entry/:type/:id', async (req, res) => {
    const type = z.enum(['registro', 'manutencao']).parse(req.params.type);
    const id = z.uuid().parse(req.params.id);
    const token = res.locals.token as string;
    const rpc = rpcFor(token);
    const profile = profileSchema.parse(await rpc('meu_perfil', { p_token: token }));
    if (!profile.ativo || profile.perfil !== 'admin')
      throw new ApiError('Somente administradores podem excluir envios.', 403);
    await rpc('apagar_envio', { p_token: token, p_tipo: type, p_id: id });
    res.json({ ok: true });
  });
  app.use('/api', (_req, _res, next) => next(new ApiError('Operação não encontrada.', 404)));
  const errors: ErrorRequestHandler = (err, req, res, _next) => {
    const status =
      err instanceof ApiError
        ? err.status
        : err instanceof z.ZodError
          ? 422
          : err instanceof SyntaxError
            ? 400
            : 500;
    if (status === 401) {
      if (req.path.startsWith('/api/recovery')) res.clearCookie('hashi_recovery', cookies);
      else res.clearCookie(cookieName, cookies);
    }
    const message =
      err instanceof z.ZodError
        ? err.issues[0]?.message
        : err instanceof ApiError
          ? err.message
          : status === 500
            ? 'Não foi possível concluir a operação. Tente novamente.'
            : 'Solicitação inválida.';
    res.status(status).json({ error: message });
  };
  app.use(errors);
  return app;
}
