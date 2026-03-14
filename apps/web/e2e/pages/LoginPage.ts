import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page:        Page;
  readonly emailInput:  Locator;
  readonly passInput:   Locator;
  readonly submitBtn:   Locator;
  readonly errorMsg:    Locator;

  constructor(page: Page) {
    this.page       = page;
    this.emailInput = page.getByPlaceholder('tu@email.com');
    this.passInput  = page.locator('input[type="password"]');
    this.submitBtn  = page.locator('button[type="submit"]');
    this.errorMsg   = page.getByRole('alert').or(page.getByText(/credenciales|error|inválid/i));
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passInput.fill(password);
    await this.submitBtn.click();
  }

  async expectRedirectToDashboard() {
    await expect(this.page).toHaveURL(/dashboard/, { timeout: 15_000 });
  }

  async expectError() {
    await expect(this.errorMsg).toBeVisible({ timeout: 8_000 });
  }
}
