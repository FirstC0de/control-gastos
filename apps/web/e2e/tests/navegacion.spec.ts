/**
 * navegacion.spec.ts
 * Pruebas de smoke: verifica que todas las rutas principales cargan sin errores.
 * Son las pruebas más rápidas y las primeras que deberían pasar.
 */
import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/dashboard',   title: /dashboard/i,    text: /nuevo gasto/i },
  { path: '/ingresos',    title: /ingresos|finanz/i, text: /ingresos/i },
  { path: '/inversiones', title: /inversion/i,    text: /plazo|portfolio|inversion/i },
];

test.describe('Smoke — todas las rutas cargan', () => {
  for (const route of ROUTES) {
    test(`${route.path} carga sin error 500`, async ({ page }) => {
      const response = await page.goto(route.path);
      // No debe ser un error de servidor
      expect(response?.status()).not.toBe(500);
      expect(response?.status()).not.toBe(404);
      // Al menos un elemento de contenido visible
      await expect(page.getByText(route.text)).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe('Responsive — elementos críticos visibles en mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('dashboard tiene el formulario de gasto visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByPlaceholder(/en qué gastaste/i)).toBeVisible({ timeout: 10_000 });
  });

  test('ingresos tiene las tabs visibles', async ({ page }) => {
    await page.goto('/ingresos');
    await expect(page.getByRole('button', { name: /ingresos/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /presupuestos/i })).toBeVisible();
  });

  test('títulos de sección no se superponen', async ({ page }) => {
    await page.goto('/ingresos');
    // El título "Nuevo ingreso" y el botón "Gestionar categorías" deben estar en pantalla
    const title  = page.getByText(/nuevo ingreso/i).first();
    const catBtn = page.getByRole('button', { name: /gestionar/i }).first();
    await expect(title).toBeVisible({ timeout: 8_000 });
    await expect(catBtn).toBeVisible();
    // Verificar que no se superponen (bounding boxes no se intersectan)
    const titleBox  = await title.boundingBox();
    const catBtnBox = await catBtn.boundingBox();
    if (titleBox && catBtnBox) {
      const overlap = titleBox.x < catBtnBox.x + catBtnBox.width &&
                      titleBox.x + titleBox.width > catBtnBox.x;
      // Si están en la misma línea vertical (misma fila), no deben solaparse
      const sameRow = Math.abs(titleBox.y - catBtnBox.y) < 10;
      if (sameRow) expect(overlap).toBe(false);
    }
  });
});
