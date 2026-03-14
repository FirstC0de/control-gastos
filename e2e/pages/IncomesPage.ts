import { Page, Locator, expect } from '@playwright/test';

export class IncomesPage {
  readonly page: Page;
  readonly tab:       Locator;
  readonly nameInput: Locator;
  readonly amtInput:  Locator;
  readonly addBtn:    Locator;
  readonly list:      Locator;

  constructor(page: Page) {
    this.page      = page;
    this.tab       = page.getByRole('button', { name: /ingresos/i });
    this.nameInput = page.getByPlaceholder(/nombre|concepto/i);
    this.amtInput  = page.getByPlaceholder('0.00').first();
    this.addBtn    = page.getByRole('button', { name: /agregar ingreso/i });
    this.list      = page.locator('ul, [role="list"]').filter({ has: page.getByText(/ingreso/i) }).first();
  }

  async goto() {
    await this.page.goto('/ingresos');
    await this.page.waitForLoadState('networkidle');
  }

  async addIncome(name: string, amount: number) {
    await this.nameInput.fill(name);
    await this.amtInput.fill(String(amount));
    await this.addBtn.click();
    await expect(this.nameInput).toHaveValue('', { timeout: 8_000 });
  }
}
