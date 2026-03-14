/**
 * fixtures/index.ts
 * Extiende el `test` base de Playwright con Page Objects pre-instanciados.
 * Uso: import { test, expect } from '../fixtures';
 */
import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage }     from '../pages/LoginPage';
import { IncomesPage }   from '../pages/IncomesPage';

type Fixtures = {
  dashboardPage: DashboardPage;
  loginPage:     LoginPage;
  incomesPage:   IncomesPage;
};

export const test = base.extend<Fixtures>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  incomesPage: async ({ page }, use) => {
    await use(new IncomesPage(page));
  },
});

export { expect } from '@playwright/test';
