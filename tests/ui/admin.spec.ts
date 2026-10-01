import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await expect(page.locator('main[data-page="inicio"]')).toBeVisible();
});
async function go(page: Page, name: string, key: string) {
  if (!(await page.locator('main[data-page="menu"]').count()))
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Serviços', exact: true })
    .getByRole('link', { name, exact: true })
    .first()
    .click();
  await expect(page.locator(`main[data-page="${key}"]`)).toBeVisible();
}
async function choose(page: Page, label: string, option: string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: new RegExp(`^${label} `) }).click();
  await dialog.getByRole('option', { name: option, exact: true }).click();
}

test('admin creates catalogs and selects the new references in a saved team', async ({ page }) => {
  await go(page, 'Veículos', 'veiculos');
  await page.getByRole('button', { name: 'Novo veículo', exact: true }).click();
  await page.getByLabel('Placa / identificação').fill('web-1234');
  await page.getByLabel('Tipo', { exact: true }).selectOption('equipamento');
  await page.getByLabel('Modelo', { exact: true }).fill('Equipamento Web');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.catalog-card').filter({ hasText: 'WEB-1234' })).toContainText(
    'Equipamento',
  );
  await go(page, 'Funcionários', 'funcionarios');
  await page.getByRole('button', { name: 'Novo funcionário' }).click();
  await page.getByLabel('Nome completo').fill('Pessoa Teste do Web');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await go(page, 'Contratos', 'contratos');
  await page.getByRole('button', { name: 'Novo contrato' }).click();
  await page.getByLabel('Nome do contrato').fill('Contrato Criado Web');
  await page.getByRole('button', { name: 'Salvar cadastro' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(
    page.locator('.catalog-card').filter({ hasText: 'Contrato Criado Web' }),
  ).toBeVisible();
  await go(page, 'Registro de equipes', 'equipes');
  await page.getByRole('button', { name: 'Novo registro', exact: true }).click();
  await choose(page, 'Contrato', 'Contrato Criado Web');
  await choose(page, 'Responsável da equipe 1', 'Pessoa Teste do Web');
  await choose(page, 'Veículo da equipe 1', 'WEB-1234 Equipamento Web');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Registro enviado com sucesso.')).toBeVisible();
});

test('admin creates user, views entered password and resets without a recovery code', async ({
  page,
}) => {
  await go(page, 'Usuários', 'usuarios');
  await expect(page.getByText('As senhas atuais são protegidas', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Novo usuário' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome', { exact: true }).fill('Pessoa');
  await dialog.getByLabel('Sobrenome', { exact: true }).fill('Teste');
  await dialog.getByLabel('Usuário', { exact: true }).fill('novo_web');
  await dialog.getByLabel('Nova senha', { exact: true }).fill('SenhaWebTeste2026!');
  await dialog.getByLabel('Confirmar nova senha').fill('OutraSenha2026!');
  await dialog.getByRole('button', { name: 'Criar usuário' }).click();
  await expect(dialog.getByRole('alert')).toContainText('As senhas não coincidem');
  await dialog.getByLabel('Confirmar nova senha').fill('SenhaWebTeste2026!');
  await dialog.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(dialog.getByLabel('Nova senha', { exact: true })).toHaveAttribute('type', 'text');
  await dialog.getByRole('button', { name: 'Criar usuário' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('tbody tr').filter({ hasText: 'novo_web' })).toContainText(
    'Pessoa Teste',
  );
  await page.getByRole('button', { name: 'Alterar senha de novo_web' }).click();
  await expect(page.getByLabel('Código de recuperação')).toHaveCount(0);
  await dialog.getByLabel('Nova senha', { exact: true }).fill('NovaSenhaWeb2026!');
  await dialog.getByLabel('Confirmar nova senha').fill('NovaSenhaWeb2026!');
  await dialog.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Senha de novo_web alterada com sucesso.')).toBeVisible();
  const users = await (await page.request.get('/api/admin/users')).text();
  expect(users).not.toMatch(/password|senha_hash|SenhaWebTeste|NovaSenhaWeb/);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(
    /SenhaWebTeste|NovaSenhaWeb/,
  );
  await page.screenshot({ path: 'test-results/usuarios-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: 'test-results/usuarios-mobile.png',
    fullPage: true,
    animations: 'disabled',
  });
});

test('own password change closes current session and employee cannot open administration', async ({
  page,
}) => {
  await go(page, 'Usuários', 'usuarios');
  await page.getByRole('button', { name: 'Alterar senha de demonstracao' }).click();
  await page.getByLabel('Nova senha', { exact: true }).fill('SenhaPropria2026!');
  await page.getByLabel('Confirmar nova senha').fill('SenhaPropria2026!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('button', { name: 'Entrar no hashi' })).toBeVisible();
  await expect(
    page.getByText('Sua senha foi alterada. Entre novamente com a nova senha.'),
  ).toBeVisible();
  await page.request.post('/api/demo', {
    headers: { Origin: new URL(page.url()).origin },
    data: { role: 'funcionario' },
  });
  await page.reload();
  await expect(page.getByText('Acesso restrito', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.locator('main[data-page="menu"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0);
  expect((await page.request.get('/api/admin/users')).status()).toBe(403);
  for (const [name, key, button] of [
    ['Veículos', 'veiculos', 'Novo veículo'],
    ['Funcionários', 'funcionarios', 'Novo funcionário'],
    ['Contratos', 'contratos', 'Novo contrato'],
  ]) {
    await go(page, name, key);
    await expect(page.getByRole('button', { name: button, exact: true })).toHaveCount(0);
  }
});
