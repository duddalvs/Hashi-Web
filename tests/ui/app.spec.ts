import { test, expect, type Page } from '@playwright/test';
import { today } from '../../src/domain/rules';
const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
});
test.afterEach(() => {
  expect(errors).toEqual([]);
});
async function preview(page: Page, employee = false) {
  await page.goto('/');
  if (employee) {
    await page.request.post('/api/demo', {
      headers: { Origin: new URL(page.url()).origin },
      data: { role: 'funcionario' },
    });
    await page.reload();
  } else await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await expect(page.locator('main[data-page="inicio"]')).toBeVisible();
}
async function go(page: Page, title: string, key: string) {
  if (!(await page.locator('main[data-page="menu"]').count()))
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Serviços', exact: true })
    .getByRole('link', { name: title, exact: true })
    .first()
    .click();
  await expect(page.locator(`main[data-page="${key}"]`)).toBeVisible();
}
async function select(page: Page, label: string, option: string) {
  const scope = (await page.getByRole('dialog').count()) ? page.getByRole('dialog') : page;
  await scope.getByRole('button', { name: new RegExp(`^${label} `) }).click();
  await scope.getByRole('option', { name: option, exact: true }).click();
}
test('login, session cookie, restoration, no browser token and logout', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByText('Entre com o mesmo usuário e senha do Hashi App.')).toBeVisible();
  await page.getByLabel('Senha', { exact: true }).fill('test-only');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await expect(page.locator('main')).toBeVisible();
  const cookie = (await context.cookies()).find((c) => c.name === 'hashi_session');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Strict');
  expect(await page.evaluate(() => document.cookie)).not.toContain('hashi_session');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('demo-');
  await page.reload();
  await expect(page.locator('main[data-page=inicio]')).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrar no hashi' })).toBeVisible();
  expect((await context.cookies()).some((c) => c.name === 'hashi_session')).toBe(false);
});
test('days expand by contract; a team opens the complete parent record', async ({ page }) => {
  await preview(page);
  await go(page, 'Registro de equipes', 'equipes');
  await expect(page.getByRole('tab', { name: /Visão por dia/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(await page.locator('.day-group').count()).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Hoje', exact: true }).click();
  await expect(page.locator('.day-group')).toHaveCount(1);
  await expect(page.locator('.day-contract')).toHaveCount(3);
  await page.locator('.team-card').first().click();
  await expect(page.getByRole('dialog')).toContainText('Detalhes do registro de equipes');
  await expect(page.locator('.detail-team')).toHaveCount(3);
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('button', { name: /Todos os dias/ }).click();
  await page.getByRole('button', { name: 'Expandir dias', exact: true }).click();
  await expect(page.locator('.day-group.expanded')).toHaveCount(8);
  await page.getByRole('button', { name: 'Recolher dias', exact: true }).click();
  await expect(page.locator('.day-group.expanded')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/equipes-desktop.png', fullPage: true });
});
test('filters combine on the same team; CSV and paging follow results', async ({ page }) => {
  await preview(page);
  await go(page, 'Registro de equipes', 'equipes');
  await page.getByRole('tab', { name: /Consulta com filtros/ }).click();
  await expect(page.locator('tbody tr')).toHaveCount(15);
  await page.getByRole('button', { name: 'Próxima página' }).click();
  await expect(page.locator('.table-pagination')).toContainText('16–30');
  await select(page, 'Contrato', 'Duque de Caxias');
  await select(page, 'Responsável / motorista', 'André Pereira');
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await expect(page.locator('tbody')).toContainText('André Pereira');
  await select(page, 'Veículo', 'BDU9C81');
  await expect(page.getByText('Nenhum registro encontrado', { exact: true })).toBeVisible();
  await select(page, 'Veículo', 'BBH1E97');
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await page.getByLabel('Data inicial', { exact: true }).fill(today());
  await page.getByLabel('Data final', { exact: true }).fill(today());
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
  await expect(page.locator('main[data-page="equipes"]')).toBeVisible();
  await expect(page.getByLabel('Data inicial', { exact: true })).toHaveValue(today());
  await expect(page.locator('tbody tr')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV' }).click();
  expect((await download).suggestedFilename()).toContain('hashi-equipes');
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await page.getByLabel('Buscar registros').fill('andre');
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await page.getByRole('button', { name: 'Mais filtros' }).click();
  await expect(page.getByLabel('Quantidade máxima de equipes')).toBeVisible();
  await page.getByRole('button', { name: 'Limpar filtros' }).click();
  await page.screenshot({ path: 'test-results/filtros-desktop.png', fullPage: true });
});
test('registration creates, edits with version, handles conflict and deletes', async ({ page }) => {
  await preview(page);
  await go(page, 'Registro de equipes', 'equipes');
  await page.getByRole('button', { name: 'Novo registro', exact: true }).click();
  await expect(page.getByLabel('Data', { exact: true })).toHaveAttribute('max', today());
  await select(page, 'Contrato', 'Saquarema');
  await select(page, 'Responsável da equipe 1', 'Carlos Oliveira');
  await select(page, 'Veículo da equipe 1', 'BBE9E90 M.BENZ/ACCELO 815 CE');
  await page.getByRole('button', { name: 'Adicionar equipe' }).click();
  await select(page, 'Responsável da equipe 2', 'Carlos Oliveira');
  await select(page, 'Veículo da equipe 2', 'BBH1E97 M.BENZ/ACCELO 815 CE');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Um responsável não pode se repetir');
  await select(page, 'Responsável da equipe 2', 'André Pereira');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Registro enviado');
  await page.getByRole('tab', { name: /Consulta com filtros/ }).click();
  await select(page, 'Contrato', 'Saquarema');
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: 'Editar envio', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Editar registro');
  await expect(
    page.getByRole('dialog').getByRole('button', { name: /^Contrato Saquarema/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Remover equipe 2' }).click();
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Editar envio', exact: true }).click();
  await page.route('**/api/entry/registro', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Este envio foi alterado por outra pessoa.' }),
        })
      : route.continue(),
  );
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('alterado por outra pessoa');
  await expect(page.getByRole('button', { name: 'Carregar versão atual' })).toBeVisible();
  await page.unroute('**/api/entry/registro');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir envio', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Excluir envio', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Nenhum registro encontrado', { exact: true })).toBeVisible();
});
test('maintenance preserves zero, unidentified driver, Unicode note, edit and export', async ({
  page,
}) => {
  await preview(page);
  await go(page, 'Manutenções', 'manutencoes');
  await page.getByRole('button', { name: 'Nova manutenção' }).click();
  await select(page, 'Contrato', 'Magé');
  await select(page, 'Placa do veículo', 'BBE9E90 M.BENZ/ACCELO 815 CE');
  await expect(page.getByLabel('Modelo do veículo')).toHaveValue('M.BENZ/ACCELO 815 CE');
  await expect(page.getByLabel('Modelo do veículo')).toHaveAttribute('readonly', '');
  await select(page, 'Motorista', 'Motorista não identificado');
  await select(page, 'Tipo de manutenção', 'Mecânica');
  await page.getByLabel('Observação (opcional)').fill('😀'.repeat(41));
  await expect(page.getByLabel('Observação (opcional)')).toHaveValue('😀'.repeat(40));
  await expect(page.getByText('40/40 caracteres')).toBeVisible();
  await page.getByLabel('Observação (opcional)').fill('Revisão sem custo');
  await page.getByLabel('Valor da manutenção').fill('0');
  await page.getByRole('button', { name: 'Salvar registro', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await select(page, 'Contrato', 'Magé');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Não identificado');
  await expect(page.locator('tbody')).toContainText('Revisão sem custo');
  await expect(page.locator('tbody')).toContainText('0,00');
  await page.getByRole('button', { name: 'Editar envio' }).click();
  await expect(page.getByLabel('Observação (opcional)')).toHaveValue('Revisão sem custo');
  await page.getByLabel('Observação (opcional)').fill('');
  await page.getByLabel('Valor da manutenção').fill('12345');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('tbody')).toContainText('123,45');
  await page.getByRole('button', { name: 'Mais filtros' }).click();
  await page.getByLabel('Custo mínimo (R$)').fill('200');
  await expect(page.getByText('Nenhum registro encontrado', { exact: true })).toBeVisible();
});
test('employee scope, no delete UI and server rejects forged delete', async ({ page }) => {
  await preview(page, true);
  await go(page, 'Manutenções', 'manutencoes');
  await expect(page.locator('.results-scope')).toContainText('Meus envios');
  await expect(page.getByRole('button', { name: 'Excluir envio', exact: true })).toHaveCount(0);
  const data = await (await page.request.get('/api/bootstrap')).json();
  const result = await page.request.delete(
    `/api/entry/manutencao/${data.history.find((i: { tipo: string }) => i.tipo === 'manutencao').id}`,
    { headers: { Origin: new URL(page.url()).origin }, data: {} },
  );
  expect(result.status()).toBe(403);
  await page.getByRole('button', { name: 'Editar envio' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Editar registro de manutenção');
});
test('catalog search, reports, theme, recovery messages and responsive navigation', async ({
  page,
}) => {
  await preview(page);
  await go(page, 'Veículos', 'veiculos');
  await page.getByLabel('Pesquisar catálogo').fill('retroescavadeira');
  await expect(page.locator('.catalog-card')).toHaveCount(1);
  await go(page, 'Relatórios e custos', 'relatorios');
  await expect(page.locator('.report-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Ativar tema claro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await go(page, 'Registro de equipes', 'equipes');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/equipes-mobile.png', fullPage: true });
  await page.getByRole('tab', { name: /Consulta com filtros/ }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Novo registro', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar com minha conta' }).click();
  await page.getByRole('button', { name: 'Esqueceu sua senha?' }).click();
  await expect(page.getByLabel('Código de recuperação')).toBeVisible();
  await page.route('**/api/recovery/validate', (route) => route.fulfill({ json: { ok: true } }));
  await page.getByLabel('Usuário', { exact: true }).fill('test_user');
  await page.getByLabel('Código de recuperação').fill('code');
  await page.getByRole('button', { name: 'Validar código' }).click();
  await page.getByLabel('Nova senha', { exact: true }).fill('password_new12');
  await page.getByLabel('Confirmar nova senha').fill('wrong_password');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('alert')).toContainText('As senhas devem ser iguais');
  await page.route('**/api/recovery/reset', (route) =>
    route.fulfill({ status: 401, json: { error: 'Autorização expirada. Valide outro código.' } }),
  );
  await page.getByLabel('Confirmar nova senha').fill('password_new12');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByLabel('Código de recuperação')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Autorização expirada');
});

test('full-width service menu, logo, favorites, recent services and browser navigation', async ({
  page,
}) => {
  await preview(page);
  await expect(page.getByRole('complementary', { name: 'Menu de categorias' })).toHaveCount(0);
  expect(await page.locator('.workspace').evaluate((node) => node.getBoundingClientRect().x)).toBe(
    0,
  );
  expect(
    await page
      .locator('.workspace')
      .evaluate((node) => node.getBoundingClientRect().width === innerWidth),
  ).toBe(true);
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Menu de serviços' })).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'Menu de categorias' });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole('searchbox', { name: 'Buscar serviços' })).toBeVisible();
  await expect(
    sidebar.getByRole('navigation', { name: 'Categorias de serviços' }).getByRole('button'),
  ).toHaveCount(5);
  await expect(page.getByRole('region', { name: 'Favoritos (9)' }).getByRole('link')).toHaveCount(
    9,
  );
  await page.getByLabel('Buscar serviços').fill('analise geral');
  await expect(
    page
      .getByRole('region', { name: 'Favoritos (1)' })
      .getByRole('link', { name: 'Análise geral' }),
  ).toBeVisible();
  await page.getByLabel('Buscar serviços').fill('serviço inexistente');
  await expect(page.getByText('Nenhum serviço encontrado', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca e categoria' }).click();
  await page
    .getByRole('navigation', { name: 'Categorias de serviços' })
    .getByRole('button', { name: 'Operação', exact: true })
    .click();
  await expect(page.getByRole('region', { name: 'Favoritos (3)' }).getByRole('link')).toHaveCount(
    3,
  );
  await expect(page.getByRole('heading', { name: 'Operação', exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Serviços', exact: true })
      .getByRole('link', { name: 'Usuários', exact: true }),
  ).toHaveCount(0);
  await sidebar.getByRole('button', { name: 'Cadastros', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Favoritos (4)' }).getByRole('link')).toHaveCount(
    4,
  );
  await expect(
    page
      .getByRole('region', { name: 'Favoritos (4)' })
      .getByRole('link', { name: 'Usuários', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Todos os serviços', exact: true }).click();
  await page.getByRole('button', { name: 'Remover Contratos dos favoritos', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Outros serviços (1)' })
      .getByRole('link', { name: 'Contratos', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Favoritos (8)' }).getByRole('link')).toHaveCount(
    8,
  );
  await page.getByRole('button', { name: 'Sobre Contratos', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Os contratos que fazem parte da operação.');
  await page.getByRole('button', { name: 'Abrir serviço', exact: true }).click();
  await expect(page.locator('main[data-page="contratos"]')).toBeVisible();
  await expect(sidebar).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('main[data-page="menu"]')).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Vistos por último' }).getByRole('link').first(),
  ).toHaveAttribute('href', '#/contratos');
  await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
  await expect(page.locator('main[data-page="contratos"]')).toBeVisible();
  await expect(sidebar).toHaveCount(0);
  await page.getByRole('link', { name: 'hashi — Análise geral', exact: true }).click();
  await expect(page.locator('main[data-page="inicio"]')).toBeVisible();
  await go(page, 'Registro de equipes', 'equipes');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.locator('main[data-page="menu"]')).toBeVisible();
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.screenshot({ path: 'test-results/menu-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Ativar tema claro' }).click();
  await page.screenshot({ path: 'test-results/menu-claro.png', fullPage: true });
  for (const width of [320, 375, 430, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('button', { name: 'Fechar menu', exact: true })).toBeVisible();
    await expect(sidebar).toBeVisible();
    const sidebarBounds = await sidebar.boundingBox();
    const contentBounds = await page.locator('.menu-content').boundingBox();
    expect(sidebarBounds!.x + sidebarBounds!.width).toBeLessThanOrEqual(contentBounds!.x);
    await expect(
      page.getByRole('link', { name: 'hashi — Análise geral', exact: true }),
    ).toBeVisible();
  }
  await page.setViewportSize({ width: 430, height: 900 });
  await page.getByRole('button', { name: 'Ativar tema escuro' }).click();
  await sidebar.getByRole('button', { name: 'Gestão', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Favoritos (1)' })
      .getByRole('link', { name: 'Relatórios e custos', exact: true }),
  ).toBeVisible();
  await sidebar.getByRole('button', { name: 'Todos os serviços', exact: true }).click();
  await page.screenshot({ path: 'test-results/menu-mobile.png', fullPage: true });
  await go(page, 'Análise geral', 'inicio');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main[data-page="menu"]')).toBeVisible();
  await page.getByRole('link', { name: 'Registro de equipes', exact: true }).first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main[data-page="equipes"]')).toBeVisible();
  await page.reload();
  await expect(page.locator('main[data-page="equipes"]')).toBeVisible();
  await expect(sidebar).toHaveCount(0);
});
