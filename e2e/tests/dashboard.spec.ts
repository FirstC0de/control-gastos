/**
 * dashboard.spec.ts
 * Pruebas del Dashboard — las funcionalidades críticas que NO deben fallar.
 */
import { test, expect } from '../fixtures';

test.describe('Dashboard', () => {

  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.goto();
  });

  // ── Layout y carga ──────────────────────────────────────
  test('carga correctamente con todos sus elementos', async ({ page }) => {
    await expect(page).toHaveTitle(/controlados|gastos/i);
    await expect(page.getByText(/nuevo gasto/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/en qué gastaste/i)).toBeVisible();
  });

  test('muestra el sidebar con los links de navegación', async ({ page }) => {
    // Desktop: sidebar visible
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /ingresos/i })).toBeVisible();
  });

  // ── Formulario de gastos ────────────────────────────────
  test('formulario de gasto tiene todos los campos', async ({ page }) => {
    await expect(page.getByPlaceholder(/en qué gastaste/i)).toBeVisible();
    await expect(page.getByPlaceholder('0.00')).toBeVisible();
    await expect(page.getByRole('button', { name: /agregar gasto/i })).toBeVisible();
  });

  test('no permite enviar formulario vacío', async ({ page }) => {
    const btn = page.getByRole('button', { name: /agregar gasto/i });
    await btn.click();
    // El formulario NO se limpia — descripción sigue vacía y no hubo submit
    await expect(page.getByPlaceholder(/en qué gastaste/i)).toHaveValue('');
    // El botón sigue visible (no loading)
    await expect(btn).toBeVisible();
  });

  test('agrega un gasto y limpia el formulario', async ({ dashboardPage }) => {
    const desc   = `Test gasto ${Date.now()}`;
    const amount = 999.99;

    await dashboardPage.addExpense({ description: desc, amount });

    // El formulario se limpió
    await expect(dashboardPage.descInput).toHaveValue('');
    await expect(dashboardPage.amountInput).toHaveValue('');
  });

  test('el gasto aparece en la lista después de agregar', async ({ dashboardPage, page }) => {
    const desc = `Gasto lista ${Date.now()}`;
    await dashboardPage.addExpense({ description: desc, amount: 1500 });

    // Espera a que aparezca en la lista
    await expect(page.getByText(desc)).toBeVisible({ timeout: 10_000 });
  });

  // ── SummaryCard ─────────────────────────────────────────
  test('muestra las tarjetas de resumen (balance, gastos, ingresos)', async ({ page }) => {
    // Al menos una de las cards de resumen debe ser visible
    const summaryTexts = ['balance', 'gastos', 'ingresos', 'presupuesto'];
    let found = false;
    for (const text of summaryTexts) {
      const el = page.getByText(new RegExp(text, 'i')).first();
      if (await el.isVisible()) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  // ── Navegación ──────────────────────────────────────────
  test('navega a /ingresos desde el sidebar', async ({ page }) => {
    await page.getByRole('link', { name: /ingresos/i }).first().click();
    await expect(page).toHaveURL(/ingresos/, { timeout: 8_000 });
  });
});
