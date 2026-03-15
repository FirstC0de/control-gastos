import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useExchangeRate } from './ExchangeRateContext';
import {
  fetchExpenses, createExpense as apiCreateExpense, updateExpense as apiUpdateExpense, deleteExpense as apiDeleteExpense,
  fetchIncomes, createIncome as apiCreateIncome, updateIncome as apiUpdateIncome, deleteIncome as apiDeleteIncome,
  fetchBudgets, createBudget as apiCreateBudget, updateBudget as apiUpdateBudget, deleteBudget as apiDeleteBudget,
  fetchCategories, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory, hideCategory as apiHideCategory, restoreCategory as apiRestoreCategory,
  checkAndSeedCategories, fetchMonthlyIncome, updateMonthlyIncome as apiUpdateMonthlyIncome,
  fetchCards, createCard as apiCreateCard, updateCard as apiUpdateCard, deleteCard as apiDeleteCard,
  fetchSavings, createSaving as apiCreateSaving, updateSaving as apiUpdateSaving, deleteSaving as apiDeleteSaving,
  fetchSavingTransactions, createSavingTransaction as apiCreateSavingTransaction, deleteSavingTransaction as apiDeleteSavingTransaction,
  fetchFixedTerms, createFixedTerm as apiCreateFixedTerm, updateFixedTerm as apiUpdateFixedTerm, deleteFixedTerm as apiDeleteFixedTerm,
  fetchInvestments, createInvestment as apiCreateInvestment, updateInvestment as apiUpdateInvestment, deleteInvestment as apiDeleteInvestment,
} from '../lib/api';
import {
  Expense, Income, Budget, BudgetStatus, Category, CategoryType, FinanceContextType,
  Card, Currency, Saving, SavingsSummary, SavingTransaction,
  FixedTerm, FixedTermStatus, Investment, InvestmentStatus, PortfolioSummary,
  suggestCategory as suggestCategoryFn,
} from '@controlados/shared';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [savingTransactions, setSavingTransactions] = useState<SavingTransaction[]>([]);
  const [fixedTerms, setFixedTerms] = useState<FixedTerm[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { blue } = useExchangeRate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setDataLoading(true);
        Promise.all([
          fetchExpenses().then(setExpenses),
          fetchIncomes().then(setIncomes),
          fetchBudgets().then(setBudgets),
          fetchCategories().then(async (cats) => {
            setCategories(cats);
            const seeded = await checkAndSeedCategories().catch(() => false);
            if (seeded) fetchCategories().then(setCategories).catch(console.error);
          }),
          fetchMonthlyIncome().then(setMonthlyIncome),
          fetchCards().then(setCards),
          fetchSavings().then(setSavings),
          fetchSavingTransactions().then(setSavingTransactions),
          fetchFixedTerms().then(setFixedTerms),
          fetchInvestments().then(setInvestments),
        ]).catch(console.error).finally(() => setDataLoading(false));
      } else {
        setExpenses([]); setIncomes([]); setBudgets([]); setCategories([]);
        setMonthlyIncome(0); setCards([]); setSavings([]); setSavingTransactions([]);
        setFixedTerms([]); setInvestments([]);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const toARS = (amount: number, currency: Currency = 'ARS'): number =>
    currency === 'USD' ? amount * (blue || 1) : amount;

  const monthlyExpenses = useMemo(() => {
    const { year, month } = selectedMonth;
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const selAbsMonth = year * 12 + month;
    return expenses.reduce<Expense[]>((acc, e) => {
      if (e.recurring) {
        const d = new Date(e.date + 'T12:00:00');
        if (year > d.getFullYear() || (year === d.getFullYear() && month >= d.getMonth())) {
          const day = e.recurringDay ?? d.getDate();
          acc.push({ ...e, date: `${key}-${String(Math.min(day, 28)).padStart(2, '0')}` });
        }
      } else if ((e.installments ?? 1) > 1) {
        const instNum = e.installments!;
        const curInst = e.currentInstallment ?? 1;
        const baseKey = e.monthYear ?? e.date.substring(0, 7);
        const [bYearStr, bMonthStr] = baseKey.split('-');
        const baseAbsMonth = parseInt(bYearStr) * 12 + (parseInt(bMonthStr) - 1);
        const firstAbsMonth = baseAbsMonth - (curInst - 1);
        const lastAbsMonth = firstAbsMonth + (instNum - 1);
        if (selAbsMonth >= firstAbsMonth && selAbsMonth <= lastAbsMonth) {
          const instForThisMonth = selAbsMonth - firstAbsMonth + 1;
          acc.push({
            ...e,
            currentInstallment: instForThisMonth,
            amount: e.installmentAmount ?? parseFloat((e.amount / instNum).toFixed(2)),
          });
        }
      } else {
        const filterKey = e.monthYear ?? e.date.substring(0, 7);
        if (filterKey === key) acc.push(e);
      }
      return acc;
    }, []);
  }, [expenses, selectedMonth]);

  const monthlyBudgets = useMemo(() => {
    const { year, month } = selectedMonth;
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return budgets.filter(b => b.recurring || !b.monthYear || b.monthYear === key);
  }, [budgets, selectedMonth]);

  const monthlyIncomes = useMemo(() => {
    const { year, month } = selectedMonth;
    return incomes.reduce<Income[]>((acc, i) => {
      if (i.recurring) {
        const d = new Date(i.date + 'T12:00:00');
        if (year > d.getFullYear() || (year === d.getFullYear() && month >= d.getMonth())) {
          const day = i.recurringDay ?? d.getDate();
          acc.push({ ...i, date: `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}` });
        }
      } else {
        const d = new Date(i.date + 'T12:00:00');
        if (d.getFullYear() === year && d.getMonth() === month) acc.push(i);
      }
      return acc;
    }, []);
  }, [incomes, selectedMonth]);

  // ── TARJETAS ──────────────────────────────────────────────
  const addCard = async (c: Omit<Card, 'id'>) => { const card = await apiCreateCard(c); setCards(prev => [...prev, card]); };
  const updateCard = async (id: string, u: Partial<Card>) => { setCards(prev => prev.map(x => x.id === id ? { ...x, ...u } : x)); await apiUpdateCard(id, u); };
  const deleteCard = async (id: string) => { await apiDeleteCard(id); setCards(prev => prev.filter(x => x.id !== id)); };

  // ── GASTOS ────────────────────────────────────────────────
  const addExpense = async (e: Omit<Expense, 'id'>, _opts?: { silent?: boolean }) => { const expense = await apiCreateExpense(e); setExpenses(prev => [...prev, expense]); };
  const updateExpense = async (id: string, u: Partial<Expense>) => { setExpenses(prev => prev.map(x => x.id === id ? { ...x, ...u } : x)); await apiUpdateExpense(id, u); };
  const deleteExpense = async (id: string) => { await apiDeleteExpense(id); setExpenses(prev => prev.filter(x => x.id !== id)); };

  // ── INGRESOS ──────────────────────────────────────────────
  const addIncome = async (i: Omit<Income, 'id'>) => { const income = await apiCreateIncome(i); setIncomes(prev => [...prev, income]); };
  const updateIncome = async (id: string, u: Partial<Income>) => { setIncomes(prev => prev.map(x => x.id === id ? { ...x, ...u } : x)); await apiUpdateIncome(id, u); };
  const deleteIncome = async (id: string) => { await apiDeleteIncome(id); setIncomes(prev => prev.filter(x => x.id !== id)); };

  // ── PRESUPUESTOS ──────────────────────────────────────────
  const addBudget = async (b: Omit<Budget, 'id'>) => { const budget = await apiCreateBudget(b); setBudgets(prev => [...prev, budget]); };
  const updateBudget = async (id: string, u: Partial<Budget>) => { setBudgets(prev => prev.map(x => x.id === id ? { ...x, ...u } : x)); await apiUpdateBudget(id, u); };
  const deleteBudget = async (id: string) => { await apiDeleteBudget(id); setBudgets(prev => prev.filter(x => x.id !== id)); };

  // ── CATEGORÍAS ────────────────────────────────────────────
  const addCategory = async (c: Omit<Category, 'id'>) => { const cat = await apiCreateCategory(c); setCategories(prev => [...prev, cat]); };
  const updateCategory = async (id: string, u: Partial<Category>) => { setCategories(prev => prev.map(x => x.id === id ? { ...x, ...u } : x)); await apiUpdateCategory(id, u); };
  const deleteCategory = async (id: string) => { await apiDeleteCategory(id); setCategories(prev => prev.filter(x => x.id !== id)); };
  const hideCategory = async (id: string) => { await apiHideCategory(id); setCategories(prev => prev.map(x => x.id === id ? { ...x, isActive: false } : x)); };
  const restoreCategory = async (id: string) => { await apiRestoreCategory(id); setCategories(prev => prev.map(x => x.id === id ? { ...x, isActive: true } : x)); };
  const getAllCategories = () => categories;
  const suggestCategory = (description: string, type: CategoryType): string | null =>
    suggestCategoryFn(description, type, categories);

  // ── INGRESO MENSUAL ───────────────────────────────────────
  const setMonthly = async (amt: number) => { setMonthlyIncome(await apiUpdateMonthlyIncome(amt)); };

  // ── UTILIDADES ────────────────────────────────────────────
  const getCategoriesByType = (type: CategoryType) =>
    categories.filter(c => c.isActive !== false && (c.type === 'both' || c.type === type))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const getRemainingBudget = (categoryId: string) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return 0;
    const spent = monthlyExpenses.filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + toARS(e.amount, e.currency ?? 'ARS'), 0);
    return budget.amount - spent;
  };

  const getTotalExpenses = () => monthlyExpenses.reduce((sum, e) => sum + toARS(e.amount, e.currency ?? 'ARS'), 0);
  const getTotalIncome = () => monthlyIncomes.reduce((sum, i) => sum + toARS(i.amount, i.currency ?? 'ARS'), 0);
  const getBalance = () => getTotalIncome() - getTotalExpenses();

  const getInstallmentSummary = (year: number, month: number, cardId?: string | 'all') => {
    const filtered = cardId && cardId !== 'all' ? expenses.filter(e => e.cardId === cardId) : expenses;
    return filtered.reduce((acc, expense) => {
      const expDate = new Date(expense.date);
      const inst = expense.installments ?? 1;
      const instAmount = expense.installmentAmount ?? expense.amount;
      if (inst === 1) {
        if (expDate.getFullYear() === year && expDate.getMonth() === month) {
          acc.cash += expense.amount; acc.cashItems.push(expense);
        }
      } else {
        const monthsDiff = (year - expDate.getFullYear()) * 12 + (month - expDate.getMonth());
        const installmentIndex = 1 + monthsDiff;
        if (installmentIndex >= 1 && installmentIndex <= inst) {
          acc.installments += instAmount;
          acc.installmentItems.push({ ...expense, currentInstallment: installmentIndex });
        }
      }
      return acc;
    }, { cash: 0, installments: 0, cashItems: [] as Expense[], installmentItems: [] as (Expense & { currentInstallment: number })[] });
  };

  const getMonthlyProjection = (months = 6, cardId?: string | 'all') => {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      const summary = getInstallmentSummary(date.getFullYear(), date.getMonth(), cardId);
      return { label, year: date.getFullYear(), month: date.getMonth(), total: summary.cash + summary.installments, cash: summary.cash, installments: summary.installments };
    });
  };

  const getBudgetStatus = (): BudgetStatus[] =>
    monthlyBudgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spentAmount = monthlyExpenses.filter(e => e.categoryId === b.categoryId)
        .reduce((s, e) => s + toARS(e.amount, e.currency ?? 'ARS'), 0);
      const remaining = b.amount - spentAmount;
      const percentageUsed = b.amount > 0 ? (spentAmount / b.amount) * 100 : 0;
      const threshold = b.alertThreshold ?? 80;
      const status: BudgetStatus['status'] = percentageUsed >= 100 ? 'exceeded' : percentageUsed >= threshold ? 'warning' : 'ok';
      return { budget: b, categoryName: cat?.name ?? null, budgetAmount: b.amount, spentAmount, remaining, percentageUsed, status };
    });

  const copyBudgetsFromPreviousMonth = async (): Promise<number> => {
    const { year, month } = selectedMonth;
    const prevDate = new Date(year, month - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const curKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const prevBudgets = budgets.filter(b => !b.recurring && b.monthYear === prevKey);
    const curBudgets = budgets.filter(b => !b.recurring && b.monthYear === curKey);
    const toCreate = prevBudgets.filter(pb => !curBudgets.some(cb => cb.name === pb.name && cb.categoryId === pb.categoryId));
    await Promise.all(toCreate.map(pb => addBudget({ name: pb.name, categoryId: pb.categoryId ?? null, amount: pb.amount, period: pb.period, recurring: false, monthYear: curKey, alertThreshold: pb.alertThreshold })));
    return toCreate.length;
  };

  // ── AHORROS ───────────────────────────────────────────────
  const addSaving = async (data: Omit<Saving, 'id'>) => { const saving = await apiCreateSaving(data); setSavings(prev => [...prev, saving]); };
  const updateSaving = async (id: string, data: Partial<Saving>) => { setSavings(prev => prev.map(x => x.id === id ? { ...x, ...data } : x)); await apiUpdateSaving(id, data); };
  const deleteSaving = async (id: string) => { await apiDeleteSaving(id); setSavings(prev => prev.filter(x => x.id !== id)); };

  const getSavingsSummary = (): SavingsSummary => {
    const totalARS = savings.filter(s => s.currency === 'ARS').reduce((sum, s) => sum + s.balance, 0);
    const totalUSD = savings.filter(s => s.currency === 'USD').reduce((sum, s) => sum + s.balance, 0);
    const totalConverted = totalARS + totalUSD * (blue || 1);
    const byType = savings.reduce((acc, s) => {
      const val = s.currency === 'USD' ? s.balance * (blue || 1) : s.balance;
      acc[s.type] = (acc[s.type] ?? 0) + val;
      return acc;
    }, {} as Partial<Record<string, number>>);
    return { totalARS, totalUSD, totalConverted, byType };
  };

  const addSavingTransaction = async (data: Omit<SavingTransaction, 'id'>) => {
    const { transaction, newBalance } = await apiCreateSavingTransaction(data);
    setSavingTransactions(prev => [transaction, ...prev]);
    setSavings(prev => prev.map(s => s.id === data.savingId ? { ...s, balance: newBalance } : s));
  };

  const deleteSavingTransaction = async (id: string) => {
    const t = savingTransactions.find(tx => tx.id === id);
    if (!t) return;
    const newBalance = await apiDeleteSavingTransaction(id, t.savingId, t.amount, t.type);
    setSavingTransactions(prev => prev.filter(tx => tx.id !== id));
    setSavings(prev => prev.map(s => s.id === t.savingId ? { ...s, balance: newBalance } : s));
  };

  // ── PLAZOS FIJOS ──────────────────────────────────────────
  const addFixedTerm = async (data: Omit<FixedTerm, 'id'>) => { const ft = await apiCreateFixedTerm(data); setFixedTerms(prev => [...prev, ft]); };
  const updateFixedTerm = async (id: string, data: Partial<FixedTerm>) => { setFixedTerms(prev => prev.map(x => x.id === id ? { ...x, ...data } : x)); await apiUpdateFixedTerm(id, data); };
  const deleteFixedTerm = async (id: string) => { await apiDeleteFixedTerm(id); setFixedTerms(prev => prev.filter(x => x.id !== id)); };

  const getFixedTermStatus = (): FixedTermStatus[] => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return fixedTerms.map(ft => {
      const start = new Date(ft.startDate + 'T12:00:00');
      const end = new Date(ft.endDate + 'T12:00:00');
      const daysTotal = Math.round((end.getTime() - start.getTime()) / 86400000);
      const elapsed = Math.round((today.getTime() - start.getTime()) / 86400000);
      const daysElapsed = Math.min(Math.max(0, elapsed), daysTotal);
      const daysRemaining = Math.round((end.getTime() - today.getTime()) / 86400000);
      const dailyRate = ft.rate / 100 / 365;
      const accruedInterest = ft.principal * dailyRate * daysElapsed;
      const projectedInterest = ft.principal * dailyRate * daysTotal;
      return { fixedTerm: ft, daysElapsed, daysTotal, daysRemaining, accruedInterest, projectedInterest, currentValue: ft.principal + accruedInterest, isExpired: daysRemaining < 0, isExpiringSoon: daysRemaining >= 0 && daysRemaining <= 7 };
    });
  };

  // ── INVERSIONES ───────────────────────────────────────────
  const addInvestment = async (data: Omit<Investment, 'id'>) => { const inv = await apiCreateInvestment(data); setInvestments(prev => [...prev, inv]); };
  const updateInvestment = async (id: string, data: Partial<Investment>) => { setInvestments(prev => prev.map(x => x.id === id ? { ...x, ...data } : x)); await apiUpdateInvestment(id, data); };
  const deleteInvestment = async (id: string) => { await apiDeleteInvestment(id); setInvestments(prev => prev.filter(x => x.id !== id)); };

  const getInvestmentStatus = (): InvestmentStatus[] =>
    investments.map(inv => {
      const purchaseValue = inv.quantity * inv.purchasePrice;
      const currentValue = inv.quantity * inv.currentPrice;
      const unrealizedGain = currentValue - purchaseValue;
      return { investment: inv, purchaseValue, currentValue, unrealizedGain, unrealizedGainPct: purchaseValue > 0 ? (unrealizedGain / purchaseValue) * 100 : 0 };
    });

  const getPortfolioSummary = (): PortfolioSummary => {
    const savingsSummary = getSavingsSummary();
    const ftStatuses = getFixedTermStatus();
    const invStatuses = getInvestmentStatus();
    const fixedTermsTotalConverted = ftStatuses.reduce((sum, ft) => sum + (ft.fixedTerm.currency === 'USD' ? ft.currentValue * (blue || 1) : ft.currentValue), 0);
    const fixedTermsProjectedInterest = ftStatuses.reduce((sum, ft) => sum + (ft.fixedTerm.currency === 'USD' ? ft.projectedInterest * (blue || 1) : ft.projectedInterest), 0);
    const investmentsTotalConverted = invStatuses.reduce((sum, inv) => sum + (inv.investment.currency === 'USD' ? inv.currentValue * (blue || 1) : inv.currentValue), 0);
    const investmentsTotalGain = invStatuses.reduce((sum, inv) => sum + (inv.investment.currency === 'USD' ? inv.unrealizedGain * (blue || 1) : inv.unrealizedGain), 0);
    return { savingsTotalConverted: savingsSummary.totalConverted, fixedTermsTotalConverted, fixedTermsProjectedInterest, investmentsTotalConverted, investmentsTotalGain, grandTotal: savingsSummary.totalConverted + fixedTermsTotalConverted + investmentsTotalConverted };
  };

  return (
    <FinanceContext.Provider value={{
      expenses, incomes, budgets, categories, monthlyIncome, cards,
      savings, savingTransactions, fixedTerms, investments,
      addExpense, updateExpense, deleteExpense,
      addIncome, updateIncome, deleteIncome,
      addBudget, updateBudget, deleteBudget,
      addCategory, updateCategory, deleteCategory, hideCategory, restoreCategory, getAllCategories, suggestCategory, getCategoriesByType,
      setMonthlyIncome: setMonthly, getRemainingBudget, getTotalExpenses, getTotalIncome, getBalance,
      selectedMonth, setSelectedMonth, monthlyExpenses, monthlyIncomes, monthlyBudgets,
      getBudgetStatus, copyBudgetsFromPreviousMonth,
      addCard, updateCard, deleteCard, getInstallmentSummary, getMonthlyProjection,
      addSaving, updateSaving, deleteSaving, getSavingsSummary,
      addSavingTransaction, deleteSavingTransaction,
      addFixedTerm, updateFixedTerm, deleteFixedTerm, getFixedTermStatus,
      addInvestment, updateInvestment, deleteInvestment, getInvestmentStatus, getPortfolioSummary,
      dataLoading,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
};
