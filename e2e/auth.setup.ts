/**
 * auth.setup.ts
 * Se ejecuta UNA SOLA VEZ antes de todos los tests.
 * Hace login con Firebase y guarda el storageState (cookies + localStorage)
 * para que los demás tests no tengan que autenticarse.
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const AUTH_FILE = path.join(__dirname, '.auth/user.json');

setup('autenticar usuario de prueba', async ({ page }) => {
  const email    = process.env.TEST_EMAIL    ?? 'test@test.com';
  const password = process.env.TEST_PASSWORD ?? 'asd123';

  await page.goto('/login');

  // Espera a que el formulario esté visible
  await page.getByPlaceholder('tu@email.com').fill(email);
  await page.locator('input[type="password"]').fill(password);

  // Botón submit del form de login
  await page.locator('button[type="submit"]').click();

  // Espera a que Firebase responda (puede tardar hasta 20s en frío)
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page).toHaveURL(/dashboard/);

  // Guarda la sesión (localStorage de Firebase + cookies)
  await page.context().storageState({ path: AUTH_FILE });
});
