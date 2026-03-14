import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object — Dashboard
 * Encapsula todos los selectores y acciones del dashboard.
 * Si cambia el HTML, solo hay que editar acá, no en cada test.
 */
export class DashboardPage {
  readonly page: Page;

  // Locators reutilizables
  readonly heading:        Locator;
  readonly expenseForm:    Locator;
  readonly descInput:      Locator;
  readonly amountInput:    Locator;
  readonly submitBtn:      Locator;
  readonly expenseList:    Locator;
  readonly summaryCard:    Locator;

  constructor(page: Page) {
    this.page         = page;
    this.heading      = page.getByRole('heading', { name: /nuevo gasto/i });
    this.expenseForm  = page.locator('form').filter({ has: page.getByText(/nuevo gasto/i) });
    this.descInput    = page.getByPlaceholder(/en qué gastaste/i);
    this.amountInput  = page.getByPlaceholder('0.00');
    this.submitBtn    = page.getByRole('button', { name: /agregar gasto/i });
    this.expenseList  = page.locator('[data-testid="expense-list"]').or(
      page.getByText(/sin gastos|no hay gastos/i).locator('..')
    );
    this.summaryCard  = page.getByText(/balance|resumen/i).first().locator('..');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /** Carga un gasto y devuelve la descripción usada */
  async addExpense(opts: {
    description: string;
    amount: number;
    categoryText?: string;
  }) {
    await this.descInput.fill(opts.description);
    await this.amountInput.fill(String(opts.amount));
    await this.submitBtn.click();
    // Espera a que el formulario se limpie (descripción vacía)
    await expect(this.descInput).toHaveValue('', { timeout: 8_000 });
  }
}
