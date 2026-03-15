export type Currency = 'ARS' | 'USD';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId?: string | null;
  cardId?: string | null;
  installments?: number;
  currentInstallment?: number;
  installmentAmount?: number;
  currency?: Currency;
  comprobante?: string;
  recurring?: boolean;
  recurringDay?: number;
  monthYear?: string; // "YYYY-MM" — mes al que pertenece el gasto en el dashboard
};

export type Card = {
  id: string;
  name: string;        // "Visa Galicia", "Mastercard HSBC"
  lastFour?: string;   // últimos 4 dígitos
  color: string;       // color identificador
  closingDay: number;  // día de cierre (ej: 15)
  dueDay: number;      // día de vencimiento (ej: 5)
};

export type Income = {
  id: string;
  amount: number;
  name: string;
  type: 'monthly' | 'sales' | 'other';
  date: string;
  categoryId?: string | null;
  currency?: Currency; // ← nuevo
  recurring?: boolean;
  recurringDay?: number;
};

export type Budget = {
  id: string;
  name: string;
  categoryId?: string | null;
  amount: number;
  spent?: number;
  period: 'monthly' | 'weekly' | 'custom';
  monthYear?: string;  // "YYYY-MM" — mes al que pertenece (si no es recurrente)
  recurring?: boolean; // si se repite cada mes
  alertThreshold?: number; // % para alertar (ej: 80). Default: 80
};

export type BudgetStatus = {
  budget: Budget;
  categoryName: string | null;
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
  percentageUsed: number;
  status: 'ok' | 'warning' | 'exceeded';
};

export type CategoryType = 'expense' | 'income' | 'both';

// ── AHORROS ───────────────────────────────────────────────
export type SavingType = 'account' | 'cash' | 'wallet' | 'goal';

export type Saving = {
  id: string;
  name: string;
  type: SavingType;
  institution?: string;
  currency: Currency;
  balance: number;
  color: string;
  notes?: string;
  createdAt: string;
  // Solo para type === 'goal'
  goalAmount?: number;
  goalDate?: string;
  monthlyContribution?: number; // aporte mensual planeado (para estimar fecha)
};

export type SavingTransactionType = 'deposit' | 'withdrawal' | 'adjustment';

export type SavingTransaction = {
  id: string;
  savingId: string;
  type: SavingTransactionType;
  amount: number;
  date: string;
  notes?: string;
  sourceIncomeId?: string; // si viene de un ingreso automático
};

export type SavingsSummary = {
  totalARS: number;
  totalUSD: number;
  totalConverted: number; // todo en ARS al tipo de cambio blue
  byType: Partial<Record<SavingType, number>>; // valor en ARS por tipo
};

// ── AHORRO AUTOMÁTICO ─────────────────────────────────
export type AutoSavingRule = {
  id: string;
  categoryId: string;
  categoryName?: string;
  percentage: number;         // 1–100
  targetSavingId: string;
  targetSavingName?: string;
  isActive: boolean;
  askEveryTime: boolean;      // true → mostrar toast; false → aplicar sin preguntar
  createdAt: string;
  updatedAt?: string;
  lastApplied?: string;
  totalSaved?: number;
};

export type AutoSavingLogStatus = 'accepted' | 'declined' | 'auto_applied';

export type AutoSavingLog = {
  id: string;
  ruleId: string;
  incomeId: string;
  incomeName: string;
  incomeAmount: number;
  savedAmount: number;
  percentage: number;
  targetSavingId: string;
  targetSavingName?: string;
  status: AutoSavingLogStatus;
  createdAt: string;
};

// ── PLAZOS FIJOS ──────────────────────────────────────────
export type FixedTerm = {
  id: string;
  institution: string;
  principal: number;
  currency: Currency;
  startDate: string;    // "YYYY-MM-DD"
  endDate: string;      // "YYYY-MM-DD"
  rate: number;         // TNA en %
  renewOnExpiry: boolean;
  notes?: string;
  createdAt: string;
};

export type FixedTermStatus = {
  fixedTerm: FixedTerm;
  daysElapsed: number;
  daysTotal: number;
  daysRemaining: number;
  accruedInterest: number;
  projectedInterest: number;
  currentValue: number;
  isExpired: boolean;
  isExpiringSoon: boolean; // ≤ 7 días
};

// ── INVERSIONES ───────────────────────────────────────────
export type InvestmentType = 'stock' | 'bond' | 'cedear' | 'crypto' | 'other';

export type Investment = {
  id: string;
  name: string;
  ticker?: string;
  type: InvestmentType;
  currency: Currency;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
};

export type InvestmentStatus = {
  investment: Investment;
  purchaseValue: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPct: number;
};

export type PortfolioSummary = {
  savingsTotalConverted: number;
  fixedTermsTotalConverted: number;
  fixedTermsProjectedInterest: number;
  investmentsTotalConverted: number;
  investmentsTotalGain: number;
  grandTotal: number;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  type: CategoryType;
  icon?: string;
  // Extended fields (optional for backward compat)
  isPredefined?: boolean;
  isActive?: boolean;      // false = hidden (predefined can't be deleted, only hidden)
  keywords?: string[];
  order?: number;
  description?: string;
};

export type FinanceContextType = {
  // Datos
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  categories: Category[];
  monthlyIncome: number;

  // Categorías
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  hideCategory: (id: string) => Promise<void>;
  restoreCategory: (id: string) => Promise<void>;
  getCategoriesByType: (type: CategoryType) => Category[];
  getAllCategories: () => Category[]; // includes hidden, for admin UI
  suggestCategory: (description: string, type: CategoryType) => string | null;

  // Gastos
  addExpense: (expense: Omit<Expense, 'id'>, opts?: { silent?: boolean }) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Ingresos
  addIncome: (income: Omit<Income, 'id'>) => Promise<Income>;
  updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // Presupuestos
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  monthlyBudgets: Budget[];

  // Ingreso mensual y utilidades
  setMonthlyIncome: (amount: number) => Promise<void>;
  getRemainingBudget: (categoryId: string) => number;
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getBalance: () => number;
  selectedMonth: { year: number; month: number };
  setSelectedMonth: (m: { year: number; month: number }) => void;
  monthlyExpenses: Expense[];
  monthlyIncomes: Income[];

  getBudgetStatus: () => BudgetStatus[];
  copyBudgetsFromPreviousMonth: () => Promise<number>;

  cards: Card[];
  addCard: (card: Omit<Card, 'id'>) => Promise<void>;
  updateCard: (id: string, updates: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  getInstallmentSummary: (year: number, month: number, cardId?: string | 'all') => {
    cash: number;
    installments: number;
    cashItems: Expense[];
    installmentItems: (Expense & { currentInstallment: number })[];
  };
  getMonthlyProjection: (months?: number, cardId?: string | 'all') => {
    label: string; year: number; month: number;
    total: number; cash: number; installments: number;
  }[];

  // Ahorros
  savings: Saving[];
  addSaving: (data: Omit<Saving, 'id'>) => Promise<void>;
  updateSaving: (id: string, data: Partial<Saving>) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
  getSavingsSummary: () => SavingsSummary;

  // Transacciones de ahorro
  savingTransactions: SavingTransaction[];
  addSavingTransaction: (data: Omit<SavingTransaction, 'id'>) => Promise<void>;
  deleteSavingTransaction: (id: string) => Promise<void>;

  // Plazos fijos
  fixedTerms: FixedTerm[];
  addFixedTerm: (data: Omit<FixedTerm, 'id'>) => Promise<void>;
  updateFixedTerm: (id: string, data: Partial<FixedTerm>) => Promise<void>;
  deleteFixedTerm: (id: string) => Promise<void>;
  getFixedTermStatus: () => FixedTermStatus[];

  // Inversiones
  investments: Investment[];
  addInvestment: (data: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  getInvestmentStatus: () => InvestmentStatus[];

  // Portfolio consolidado
  getPortfolioSummary: () => PortfolioSummary;

  // Estado de carga inicial
  dataLoading: boolean;

  // Ahorro automático
  autoSavingRules: AutoSavingRule[];
  autoSavingLogs: AutoSavingLog[];
  createAutoSavingRule: (rule: Omit<AutoSavingRule, 'id'>) => Promise<void>;
  updateAutoSavingRule: (id: string, updates: Partial<AutoSavingRule>) => Promise<void>;
  deleteAutoSavingRule: (id: string) => Promise<void>;
  applyAutoSaving: (income: Income, rule: AutoSavingRule, status: AutoSavingLogStatus) => Promise<void>;
  getMatchingRule: (categoryId: string | null | undefined) => AutoSavingRule | undefined;
};