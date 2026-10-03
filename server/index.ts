import 'dotenv/config';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import express from 'express';
import { createServer } from 'node:http';
import { createApp } from './app';
import { createRpc } from './rpc';
import { createCrlvReader } from './crlv';

const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3000);
const origin = process.env.APP_ORIGIN || `http://localhost:${port}`;
if (production && (!origin.startsWith('https://') || process.env.COOKIE_SECURE !== 'true'))
  throw new Error('Produção exige APP_ORIGIN com HTTPS e COOKIE_SECURE=true.');
const app = createApp({
  rpc: createRpc(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_PUBLISHABLE_KEY ?? ''),
  origin,
  production,
  secure: process.env.COOKIE_SECURE === 'true',
  demo: process.env.ENABLE_DEMO === 'true',
  readCrlv: createCrlvReader(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SECRET_KEY ?? ''),
});
const server = createServer(app);
if (production) {
  app.use(express.static(resolve('dist'), { index: false, maxAge: '1h' }));
  app.get('/{*path}', (_req, res) =>
    res.set('Cache-Control', 'no-cache').sendFile(resolve('dist/index.html')),
  );
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    configLoader: 'native',
    server: { middlewareMode: true, hmr: { server } },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.get('/{*path}', async (req, res, next) => {
    try {
      res
        .type('html')
        .send(await vite.transformIndexHtml(req.originalUrl, await readFile('index.html', 'utf8')));
    } catch (err) {
      next(err);
    }
  });
}
server.listen(port, '127.0.0.1', () => console.log(`hashi disponível em ${origin}`));
