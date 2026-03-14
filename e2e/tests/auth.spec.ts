/**
 * auth.spec.ts
 * Pruebas de autenticación — Login y protección de rutas.
 * No depende del storageState (usa page sin sesión).
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// Estos tests NO usan la sesión guardada
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Autenticación', () => {

  test('redirige al login si no hay sesión activa', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/, { timeout: 10_000 });
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('noexiste@example.com', 'wrongpassword');
    await loginPage.expectError();
  });

  test('login exitoso redirige al dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      process.env.TEST_EMAIL    ?? 'test@test.com',
      process.env.TEST_PASSWORD ?? 'asd123',
    );
    await loginPage.expectRedirectToDashboard();
  });

  test('rutas protegidas redirigen al login', async ({ page }) => {
    for (const route of ['/dashboard', '/ingresos', '/inversiones']) {
      await page.goto(route);
      await expect(page).toHaveURL(/login/, { timeout: 8_000 });
    }
  });
});
