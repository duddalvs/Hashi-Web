const { spawn } = require('node:child_process');
const { mkdirSync, createWriteStream, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

async function openBrowser(address) {
  if (process.argv.includes('--no-browser') || process.platform !== 'win32') return;
  const browser = spawn('rundll32.exe', ['url.dll,FileProtocolHandler', address], {
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
  });
  await new Promise((resolveSpawn, reject) => {
    browser.once('spawn', resolveSpawn);
    browser.once('error', reject);
  });
  browser.unref();
}

async function main() {
  const root = resolve(__dirname, '..');
  process.chdir(root);
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 12)) {
    throw new Error('Instale o Node.js 22.12 ou superior para iniciar o hashi.');
  }
  if (!existsSync(resolve(root, 'node_modules/tsx/dist/cli.mjs'))) {
    throw new Error('Instale as dependências com npm.cmd ci e abra INICIAR.cmd novamente.');
  }
  require('dotenv').config({ quiet: true });
  const argument = (name) =>
    process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
  const port = Number(argument('--listen-port') || process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT deve ser uma porta válida entre 1 e 65535.');
  const url = new URL(
    argument('--app-origin') || process.env.APP_ORIGIN || `http://localhost:${port}`,
  );
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      'O iniciador é para uso local. Configure APP_ORIGIN=http://localhost:3000 no .env.',
    );
  }
  const address = url.origin;
  if (Number(url.port || 80) !== port)
    throw new Error('A porta de APP_ORIGIN deve ser igual a PORT no .env.');
  process.env.PORT = String(port);
  process.env.APP_ORIGIN = address;
  async function running() {
    try {
      const response = await fetch(`${address}/api/config`, { signal: AbortSignal.timeout(1200) });
      if (!response.ok) return false;
      const config = await response.json();
      return typeof config.demo === 'boolean';
    } catch {
      return false;
    }
  }

  if (await running()) {
    console.log(`hashi já está disponível em ${address}`);
    console.log('Mantenha aberta a janela que iniciou o servidor.');
    await openBrowser(address);
    return;
  }

  mkdirSync(resolve(root, '.tools'), { recursive: true });
  const log = createWriteStream(resolve(root, '.tools/hashi-server.log'), { flags: 'a' });
  log.on('error', (error) => console.error(`Não foi possível gravar o log: ${error.message}`));
  const report = (message) => {
    console.log(message);
    log.write(`[${new Date().toISOString()}] ${message}\n`);
  };
  report('Iniciando o hashi. Aguarde a abertura do navegador…');
  // Keep the server attached to this launcher and show its output in the same window.
  // Use the loader directly so this child is the actual server, without an extra CLI process.
  const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'development' },
    windowsHide: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (data) => {
    process.stdout.write(data);
    log.write(data);
  });
  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    log.write(data);
  });
  let stopped;
  const finished = new Promise((resolveExit) => {
    child.once('error', (error) => {
      stopped = { code: 1, error };
      resolveExit(stopped);
    });
    child.once('exit', (code, signal) => {
      stopped = { code, signal };
      resolveExit(stopped);
    });
  });
  let closing = false;
  const stop = () => {
    closing = true;
    if (!stopped) child.kill();
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    const deadline = Date.now() + 25000;
    while (!(await running())) {
      if (closing) return;
      if (stopped) {
        throw new Error(
          stopped.error?.message ||
            'O servidor encerrou durante a inicialização. Veja o erro acima.',
        );
      }
      if (Date.now() >= deadline) {
        throw new Error(
          'O servidor não respondeu. Consulte .tools\\hashi-server.log na pasta do projeto.',
        );
      }
      await delay(350);
    }
    if (stopped) throw new Error('O servidor encerrou durante a inicialização. Veja o erro acima.');
    report(`Servidor pronto (PID ${child.pid}): ${address}`);
    report('MANTENHA ESTA JANELA ABERTA enquanto usar o hashi. Pode minimizá-la.');
    report('Fechar esta janela ou pressionar Ctrl+C encerra o servidor.');
    try {
      await openBrowser(address);
    } catch {
      report(`Não foi possível abrir o navegador automaticamente. Acesse ${address}`);
    }
    const result = await finished;
    if (!closing) {
      throw new Error(
        `O servidor encerrou (código ${result.code ?? result.signal}). Consulte o erro acima ou .tools\\hashi-server.log.`,
      );
    }
  } finally {
    stop();
    await finished;
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
    report('Servidor encerrado. Abra INICIAR.cmd para iniciar novamente.');
    log.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
