/**
 * ingresos.spec.ts
 * Pruebas de la página de Ingresos y Presupuestos.
 */
import { test, expect } from '../fixtures';

test.describe('Ingresos', () => {

  test.beforeEach(async ({ incomesPage }) => {
    await incomesPage.goto();
  });

  test('carga la página con tabs de Ingresos y Presupuestos', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ingresos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /presupuestos/i })).toBeVisible();
  });

  test('muestra el formulario de nuevo ingreso', async ({ page }) => {
    await expect(page.getByText(/nuevo ingreso/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /agregar ingreso/i })).toBeVisible();
  });

  test('cambia a la tab de Presupuestos', async ({ page }) => {
    await page.getByRole('button', { name: /presupuestos/i }).click();
    await expect(page.getByText(/nuevo presupuesto/i)).toBeVisible({ timeout: 5_000 });
  });

  test('agrega un ingreso y aparece en la lista', async ({ page }) => {
    const name   = `Sueldo test ${Date.now()}`;
    const amount = 250000;

    await page.getByPlaceholder(/nombre|concepto/i).fill(name);
    await page.getByPlaceholder('0.00').first().fill(String(amount));
    await page.getByRole('button', { name: /agregar ingreso/i }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 10_000 });
  });

  test('el navegador de mes está visible', async ({ page }) => {
    // MonthNavigator
    const monthNav = page.getByRole('button', { name: /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i });
    await expect(monthNav.first()).toBeVisible();
  });
});

test.describe('Presupuestos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/ingresos?tab=budgets');
    await page.waitForLoadState('networkidle');
  });

  test('muestra el formulario de nuevo presupuesto', async ({ page }) => {
    await expect(page.getByText(/nuevo presupuesto/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /agregar presupuesto|crear/i })).toBeVisible();
  });
});
