import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createApp } from '../server/app';
import { ApiError, type Rpc } from '../server/rpc';
import { crlvSchema } from '../src/domain/crlv';
import { createCrlvReader } from '../server/crlv';

const pdf = Buffer.from('%PDF-1.4\nDocumento sintetico de teste\n%%EOF');
const sha256 = createHash('sha256').update(pdf).digest('hex');
const document = {
  id: randomUUID(),
  veiculo_id: 12,
  placa: 'ABC1D23',
  ano_documento: 2026,
  arquivo: 'CRLVDigital_ABC1D23_2026.pdf',
  tamanho_bytes: pdf.length,
  sha256,
  storage_bucket: 'hashi-crlv' as const,
  storage_path: `crlv/${sha256}/CRLVDigital_ABC1D23_2026.pdf`,
};
const token = 'b'.repeat(64);
type Remote = { content: Buffer | null; calls: number; status: number; networkError: boolean };
async function harness(rpc: Rpc, work: (base: string, remote: Remote) => Promise<void>) {
  const remote: Remote = { content: pdf, calls: 0, status: 200, networkError: false };
  const readCrlv = createCrlvReader(
    'https://testproject.supabase.co',
    'sb_secret_test_only',
    async (url, init) => {
      remote.calls++;
      assert.equal(url.origin, 'https://testproject.supabase.co');
      assert.equal(
        url.pathname,
        `/storage/v1/object/authenticated/hashi-crlv/${document.storage_path}`,
      );
      assert.equal(new Headers(init.headers).get('apikey'), 'sb_secret_test_only');
      assert.equal(init.redirect, 'error');
      if (remote.networkError) throw new Error('Network failure');
      if (!remote.content) return Response.json({ code: 'NoSuchKey' }, { status: 400 });
      return new Response(Uint8Array.from(remote.content), {
        status: remote.status,
        headers: { 'Content-Type': 'application/pdf' },
      });
    },
  );
  const server = createApp({
    rpc,
    origin: 'http://localhost',
    demo: true,
    readCrlv,
  }).listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  try {
    await work(`http://127.0.0.1:${(server.address() as { port: number }).port}/api`, remote);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
const request = (url: string, session = token) =>
  fetch(url, { headers: session ? { Cookie: `hashi_session=${session}` } : {} });
const filePath = `/vehicles/${document.veiculo_id}/crlv/${document.id}`;

test('CRLV requires a session and validates it remotely before serving PDF bytes', async () => {
  let calls = 0;
  await harness(
    async () => {
      calls++;
      throw new ApiError('Sessão expirada.', 401);
    },
    async (base, remote) => {
      assert.equal((await request(base + '/vehicles/crlv', '')).status, 401);
      assert.equal((await request(base + filePath, '')).status, 401);
      assert.equal(calls, 0);
      const expired = await request(base + filePath);
      assert.equal(expired.status, 401);
      assert.ok(expired.headers.get('set-cookie')?.includes('Expires=Thu, 01 Jan 1970'));
      assert.equal(calls, 1);
      assert.equal(remote.calls, 0);
    },
  );
});

test('CRLV comes from private Storage without local files and supports viewing and named download', async () => {
  await harness(
    async (name, args) => {
      assert.equal(args?.p_token, token);
      if (name === 'web_listar_crlvs') return [document];
      assert.equal(name, 'web_obter_crlv');
      assert.equal(args?.p_veiculo_id, document.veiculo_id);
      assert.equal(args?.p_documento_id, document.id);
      return document;
    },
    async (base) => {
      const list = await request(base + '/vehicles/crlv');
      assert.deepEqual(await list.json(), [crlvSchema.parse(document)]);
      for (const download of [false, true]) {
        const response = await request(base + filePath + (download ? '?download=1' : ''));
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type')!, /^application\/pdf/);
        assert.equal(
          response.headers.get('content-disposition'),
          `${download ? 'attachment' : 'inline'}; filename="${document.arquivo}"`,
        );
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
      }
    },
  );
});

test('CRLV rejects another vehicle, nonexistent documents and unsafe file names', async () => {
  for (const value of [
    null,
    { ...document, veiculo_id: 99 },
    { ...document, id: randomUUID() },
    { ...document, arquivo: '../../.env' },
    { ...document, storage_bucket: 'another-bucket' },
    { ...document, storage_path: '../../.env' },
  ]) {
    await harness(
      async () => value,
      async (base, remote) => {
        const response = await request(base + filePath);
        assert.ok([404, 422].includes(response.status));
        assert.ok(!(await response.text()).includes('%PDF'));
        assert.equal(remote.calls, 0);
      },
    );
  }
});

test('CRLV reports a missing, modified or oversized remote file without serving different bytes', async () => {
  await harness(
    async () => document,
    async (base, remote) => {
      remote.content = Buffer.from(pdf.toString().replace('teste', 'outro'));
      assert.equal((await request(base + filePath)).status, 409);
      remote.content = Buffer.concat([pdf, pdf]);
      assert.equal((await request(base + filePath)).status, 409);
      remote.content = null;
      const missing = await request(base + filePath);
      assert.equal(missing.status, 404);
      assert.match((await missing.json()).error, /não foi encontrado/);
    },
  );
});

test('Storage failures are actionable without expiring a valid user session or leaking credentials', async () => {
  await harness(
    async () => document,
    async (base, remote) => {
      for (const status of [401, 403, 500]) {
        remote.status = status;
        const response = await request(base + filePath);
        assert.equal(response.status, 503);
        assert.equal(response.headers.get('set-cookie'), null);
        assert.ok(!(await response.text()).includes('sb_secret'));
      }
      remote.networkError = true;
      assert.equal((await request(base + filePath)).status, 503);
    },
  );
});

test('cloud storage configuration cannot send the secret to an unrelated host or plain HTTP', async () => {
  for (const url of [
    'http://testproject.supabase.co',
    'https://supabase.co.attacker.example',
    'invalid',
  ]) {
    let called = false;
    const read = createCrlvReader(url, 'sb_secret_test_only', async () => {
      called = true;
      return new Response();
    });
    await assert.rejects(
      read(document),
      (error: unknown) => error instanceof ApiError && error.status === 503,
    );
    assert.equal(called, false);
  }
});

test('demo never exposes real CRLVs even when vehicle IDs overlap', async () => {
  await harness(
    async () => {
      throw new Error('Real RPC must not be called');
    },
    async (base) => {
      const login = await fetch(base + '/demo', {
        method: 'POST',
        headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' },
        body: '{}',
      });
      const session = login.headers.get('set-cookie')!.split(';')[0].split('=')[1];
      assert.deepEqual(await (await request(base + '/vehicles/crlv', session)).json(), []);
      assert.equal((await request(base + filePath, session)).status, 404);
    },
  );
});
