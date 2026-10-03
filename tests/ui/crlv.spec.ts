import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const examplePdf = readFileSync(new URL('../fixtures/crlv-exemplo.pdf', import.meta.url));

const current = {
  id: 'c034a207-a94e-4410-a242-8ce247c6b118',
  veiculo_id: 1,
  placa: 'BBE9E90',
  ano_documento: 2026,
};
const previous = {
  ...current,
  id: 'a2bf6fba-183c-4c27-ae57-b23739a30d43',
  placa: 'BBE9490',
  ano_documento: 2023,
};
async function openVehicles(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explorar demonstração' }).click();
  await expect(page.locator('main[data-page="inicio"]')).toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Serviços', exact: true })
    .getByRole('link', { name: 'Veículos', exact: true })
    .first()
    .click();
  await expect(page.locator('main[data-page="veiculos"]')).toBeVisible();
}

test('vehicle cards show CRLV, historical documents, preview and named download without Ativo badge', async ({
  page,
  context,
}) => {
  await page.route('**/api/vehicles/crlv', (route) => route.fulfill({ json: [previous, current] }));
  await context.route('**/api/vehicles/1/crlv/*', (route) => {
    const old = route.request().url().includes(previous.id);
    const download = route.request().url().includes('download=1');
    const name = old ? 'CRLVDigital_BBE9490_2023.pdf' : 'CRLVDigital_BBE9E90_2026.pdf';
    return route.fulfill({
      contentType: 'application/pdf',
      headers: {
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
      },
      body: examplePdf,
    });
  });
  await openVehicles(page);
  const card = page
    .locator('.catalog-card')
    .filter({ has: page.getByRole('heading', { name: 'BBE9E90', exact: true }) });
  await expect(card).toContainText('CRLV 2026');
  await expect(page.locator('.catalog-card').getByText('Ativo', { exact: true })).toHaveCount(0);
  await expect(page.locator('.catalog-card').filter({ hasText: 'BBH1E97' })).toContainText(
    'CRLV não disponível',
  );
  const view = card.getByRole('link', { name: 'Visualizar CRLV de BBE9E90' });
  await expect(view).toHaveAttribute('target', '_blank');
  await expect(view).toHaveAttribute('href', `/api/vehicles/1/crlv/${current.id}`);
  const popupPromise = page.waitForEvent('popup');
  await view.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL(new RegExp(current.id));
  await popup.close();
  const downloadPromise = page.waitForEvent('download');
  await card.getByRole('button', { name: 'Baixar CRLV de BBE9E90' }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('CRLVDigital_BBE9E90_2026.pdf');
  await card.getByLabel('Documento CRLV de BBE9E90').selectOption(previous.id);
  await expect(card).toContainText('Placa no documento: BBE9490');
  await expect(view).toHaveAttribute('href', `/api/vehicles/1/crlv/${previous.id}`);
  await page.screenshot({ path: 'test-results/crlv-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(card.getByRole('button', { name: 'Baixar CRLV de BBE9E90' })).toBeVisible();
  await page.screenshot({ path: 'test-results/crlv-mobile.png', fullPage: true });
});

test('failed CRLV download shows an error and allows retry without downloading JSON', async ({
  page,
}) => {
  await page.route('**/api/vehicles/crlv', (route) => route.fulfill({ json: [current] }));
  let fail = true;
  await page.route('**/api/vehicles/1/crlv/*', (route) =>
    fail
      ? route.fulfill({
          status: 404,
          json: { error: 'O arquivo do CRLV não está disponível no servidor.' },
        })
      : route.fulfill({ contentType: 'application/pdf', body: examplePdf }),
  );
  let downloads = 0;
  page.on('download', () => downloads++);
  await openVehicles(page);
  const button = page.getByRole('button', { name: 'Baixar CRLV de BBE9E90' });
  await button.click();
  await expect(page.getByRole('alert')).toContainText('O arquivo do CRLV não está disponível');
  expect(downloads).toBe(0);
  fail = false;
  const downloaded = page.waitForEvent('download');
  await button.click();
  expect((await downloaded).suggestedFilename()).toBe('CRLVDigital_BBE9E90_2026.pdf');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('CRLV query error is actionable and does not pretend the document is absent', async ({
  page,
}) => {
  let fail = true;
  await page.route('**/api/vehicles/crlv', (route) =>
    fail
      ? route.fulfill({ status: 503, json: { error: 'Não foi possível consultar os CRLVs.' } })
      : route.fulfill({ json: [current] }),
  );
  await openVehicles(page);
  await expect(page.getByRole('alert')).toContainText('Não foi possível consultar os CRLVs.');
  await expect(page.getByText('CRLV não disponível', { exact: true })).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Visualizar CRLV de BBE9E90' })).toBeVisible();
});
