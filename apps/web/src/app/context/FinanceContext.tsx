'use client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useExchangeRate } from './ExchangeRateContext';
import {
  fetchExpenses,
  createExpense as apiCreateExpense,
  updateExpense as apiUpdateExpense,   // ← nuevo
  deleteExpense as apiDeleteExpense,
  fetchIncomes,
  createIncome as apiCreateIncome,
  updateIncome as apiUpdateIncome,     // ← nuevo
  deleteIncome as apiDeleteIncome,
  fetchBudgets,
  createBudget as apiCreateBudget,
  updateBudget as apiUpdateBudget,     // ← nuevo
  deleteBudget as apiDeleteBudget,
  fetchCategories,
  createCategory as apiCreateCategory,
  updateCategory as apiUpdateCategory,
  deleteCategory as apiDeleteCategory,
  hideCategory as apiHideCategory,
  restoreCategory as apiRestoreCategory,
  checkAndSeedCategories,
  fetchMonthlyIncome,
  updateMonthlyIncome as apiUpdateMonthlyIncome,
  fetchCards,
  createCard as apiCreateCard,
  updateCard as apiUpdateCard,
  deleteCard as apiDeleteCard,
  fetchSavings,
  createSaving as apiCreateSaving,
  updateSaving as apiUpdateSaving,
  deleteSaving as apiDeleteSaving,
  fetchSavingTransactions,
  createSavingTransaction as apiCreateSavingTransaction,
  deleteSavingTransaction as apiDeleteSavingTransaction,
  fetchFixedTerms,
  createFixedTerm as apiCreateFixedTerm,
  updateFixedTerm as apiUpdateFixedTerm,
  deleteFixedTerm as apiDeleteFixedTerm,
  fetchInvestments,
  createInvestment as apiCreateInvestment,
  updateInvestment as apiUpdateInvestment,
  deleteInvestment as apiDeleteInvestment,
  fetchAutoSavingRules,
  createAutoSavingRule as apiCreateAutoSavingRule,
  updateAutoSavingRule as apiUpdateAutoSavingRule,
  deleteAutoSavingRule as apiDeleteAutoSavingRule,
  fetchAutoSavingLogs,
  createAutoSavingLog as apiCreateAutoSavingLog,
} from '../lib/api';
import {
  Expense,
  Income,
  Budget,
  BudgetStatus,
  Category,
  CategoryType,
  FinanceContextType,
  Card,
  Currency,
  Saving,
  SavingsSummary,
  SavingTransaction,
  FixedTerm,
  FixedTermStatus,
  Investment,
  InvestmentStatus,
  PortfolioSummary,
  AutoSavingRule,
  AutoSavingLog,
  AutoSavingLogStatus,
} from '@controlados/shared';
import { suggestCategory as suggestCategoryFn } from '@controlados/shared';



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
  const [autoSavingRules, setAutoSavingRules] = useState<AutoSavingRule[]>([]);
  const [autoSavingLogs, setAutoSavingLogs] = useState<AutoSavingLog[]>([]);
  const { blue } = useExchangeRate();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchExpenses().then(data => {
          setExpenses(data);
        }).catch(console.error);
        fetchIncomes().then(setIncomes).catch(console.error);
        fetchBudgets().then(setBudgets).catch(console.error);
        // Fetch categories, then seed predefined ones if first time
        fetchCategories().then(async (cats) => {
          setCategories(cats);
          const seeded = await checkAndSeedCategories().catch(() => false);
          if (seeded) fetchCategories().then(setCategories).catch(console.error);
        }).catch(console.error);
        fetchMonthlyIncome().then(setMonthlyIncome).catch(console.error);
        fetchCards().then(setCards).catch(console.error);
        fetchSavings().then(setSavings).catch(console.error);
        fetchSavingTransactions().then(setSavingTransactions).catch(console.error);
        fetchFixedTerms().then(setFixedTerms).catch(console.error);
        fetchInvestments().then(setInvestments).catch(console.error);
        fetchAutoSavingRules().then(setAutoSavingRules).catch(console.error);
        fetchAutoSavingLogs().then(setAutoSavingLogs).catch(console.error);
      } else {
        setExpenses([]);
        setIncomes([]);
        setBudgets([]);
        setCategories([]);
        setMonthlyIncome(0);
        setCards([]);
        setSavings([]);
        setSavingTransactions([]);
        setFixedTerms([]);
        setInvestments([]);
        setAutoSavingRules([]);
        setAutoSavingLogs([]);
      }


    });

    return () => unsubscribe();
  }, []);


  // Convertir un monto a ARS usando dólar blue
  const toARS = (amount: number, currency: Currency = 'ARS'): number =>
    currency === 'USD' ? amount * (blue || 1) : amount;

  const monthlyExpenses = useMemo(() => {
    const { year, month } = selectedMonth;
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    // month is 0-indexed; absolute month index for math
    const selAbsMonth = year * 12 + month;

    return expenses.reduce<Expense[]>((acc, e) => {
      if (e.recurring) {
        // Recurring: aparece cada mes desde su fecha de alta
        const d = new Date(e.date + 'T12:00:00');
        if (year > d.getFullYear() || (year === d.getFullYear() && month >= d.getMonth())) {
          const day = e.recurringDay ?? d.getDate();
          acc.push({
            ...e,
            date: `${key}-${String(Math.min(day, 28)).padStart(2, '0')}`,
          });
        }
      } else if ((e.installments ?? 1) > 1) {
        // Cuotas: expandir a todos los meses que corresponden
        const instNum    = e.installments!;
        const curInst    = e.currentInstallment ?? 1;
        const baseKey    = e.monthYear ?? e.date.substring(0, 7); // mes de ESTA cuota
        const [bYearStr, bMonthStr] = baseKey.split('-');
        // bMonthStr es 1-indexed ("01"=enero), convertir a 0-indexed para la matemática
        const baseAbsMonth  = parseInt(bYearStr) * 12 + (parseInt(bMonthStr) - 1);
        const firstAbsMonth = baseAbsMonth - (curInst - 1); // mes de la cuota 1
        const lastAbsMonth  = firstAbsMonth + (instNum - 1);

        if (selAbsMonth >= firstAbsMonth && selAbsMonth <= lastAbsMonth) {
          const instForThisMonth = selAbsMonth - firstAbsMonth + 1;
          acc.push({
            ...e,
            currentInstallment: instForThisMonth,
            // Mostrar monto por cuota (installmentAmount tiene prioridad sobre amount/N)
            amount: e.installmentAmount ?? parseFloat((e.amount / instNum).toFixed(2)),
          });
        }
      } else {
        // Gasto normal (contado)
        const filterKey = e.monthYear ?? e.date.substring(0, 7);
        if (filterKey === key) acc.push(e);
      }
      return acc;
    }, []);
  }, [expenses, selectedMonth]);

  const monthlyBudgets = useMemo(() => {
    const { year, month } = selectedMonth;
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    return budgets.filter(b => {
      if (b.recurring) return true;        // recurrente → siempre visible
      if (b.monthYear) return b.monthYear === key; // mensual → solo su mes
      return true;                          // legacy (sin campo) → siempre visible
    });
  }, [budgets, selectedMonth]);

  const monthlyIncomes = useMemo(() => {
    const { year, month } = selectedMonth;
    return incomes.reduce<Income[]>((acc, i) => {
      if (i.recurring) {
        const d = new Date(i.date + 'T12:00:00');
        if (year > d.getFullYear() || (year === d.getFullYear() && month >= d.getMonth())) {
          const day = i.recurringDay ?? d.getDate();
          acc.push({
            ...i,
            date: `${year}-${String(month + 1).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`,
          });
        }
      } else {
        const d = new Date(i.date + 'T12:00:00');
        if (d.getFullYear() === year && d.getMonth() === month) acc.push(i);
      }
      return acc;
    }, []);
  }, [incomes, selectedMonth]);

  // CRUD de tarjetas
  const addCard = async (c: Omit<Card, 'id'>): Promise<Card> => {
    const newCard = await apiCreateCard(c);
    setCards(prev => [...prev, newCard]);
    return newCard;
  };

  const updateCard = async (id: string, updates: Partial<Card>) => {
    const updated = await apiUpdateCard(id, updates);
    setCards(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteCard = async (id: string) => {
    await apiDeleteCard(id);
    setCards(prev => prev.filter(x => x.id !== id));
  };


  // --- GASTOS ---
  const addExpense = async (e: Omit<Expense, 'id'>, opts?: { silent?: boolean }) => {
    const newExp = await apiCreateExpense(e);
    setExpenses(prev => [...prev, newExp]);
    if (!opts?.silent) toast.success('Gasto agregado');
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const updated = await apiUpdateExpense(id, updates);
    setExpenses(prev => prev.map(x => x.id === id ? updated : x));
    toast.success('Gasto actualizado');
  };

  const deleteExpense = async (id: string) => {
    await apiDeleteExpense(id);
    setExpenses(prev => prev.filter(x => x.id !== id));
    toast.success('Gasto eliminado');
  };

  // --- INGRESOS ---
  const addIncome = async (i: Omit<Income, 'id'>): Promise<Income> => {
    const newInc = await apiCreateIncome(i);
    setIncomes(prev => [...prev, newInc]);
    toast.success('Ingreso agregado');
    return newInc;
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const updated = await apiUpdateIncome(id, updates);
    setIncomes(prev => prev.map(x => x.id === id ? updated : x));
    toast.success('Ingreso actualizado');
  };

  const deleteIncome = async (id: string) => {
    await apiDeleteIncome(id);
    setIncomes(prev => prev.filter(x => x.id !== id));
    toast.success('Ingreso eliminado');
  };

  // --- PRESUPUESTOS ---
  const addBudget = async (b: Omit<Budget, 'id'>) => {
    const newBud = await apiCreateBudget(b);
    setBudgets(prev => [...prev, newBud]);
    toast.success('Presupuesto creado');
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const updated = await apiUpdateBudget(id, updates);
    setBudgets(prev => prev.map(x => x.id === id ? updated : x));
    toast.success('Presupuesto actualizado');
  };

  const deleteBudget = async (id: string) => {
    await apiDeleteBudget(id);
    setBudgets(prev => prev.filter(x => x.id !== id));
    toast.success('Presupuesto eliminado');
  };

  // --- CATEGORÍAS ---
  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newCat = await apiCreateCategory(c);
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await apiUpdateCategory(id, updates);
    setCategories(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteCategory = async (id: string) => {
    await apiDeleteCategory(id);
    setCategories(prev => prev.filter(x => x.id !== id));
  };

  const hideCategory = async (id: string) => {
    await apiHideCategory(id);
    setCategories(prev => prev.map(x => x.id === id ? { ...x, isActive: false } : x));
  };

  const restoreCategory = async (id: string) => {
    await apiRestoreCategory(id);
    setCategories(prev => prev.map(x => x.id === id ? { ...x, isActive: true } : x));
  };

  const getAllCategories = () => categories;

  const suggestCategory = (description: string, type: CategoryType): string | null =>
    suggestCategoryFn(description, type, categories);

  // --- INGRESO MENSUAL ---
  const setMonthly = async (amt: number) => {
    const updatedAmt = await apiUpdateMonthlyIncome(amt);
    setMonthlyIncome(updatedAmt);
  };

  // --- MÉTODOS ÚTILES ---
  const getCategoriesByType = (type: CategoryType) =>
    categories.filter(c =>
      c.isActive !== false && (c.type === 'both' || c.type === type)
    ).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  const getRemainingBudget = (categoryId: string) => {
    const budget = budgets.find(b => b.categoryId === categoryId);
    if (!budget) return 0;
    const spent = monthlyExpenses
      .filter(e => e.categoryId === categoryId)
      .reduce((sum, e) => sum + toARS(e.amount, e.currency ?? 'ARS'), 0);
    return budget.amount - spent;
  };

  const getTotalExpenses = (): number =>
    monthlyExpenses.reduce((sum, e) => sum + toARS(e.amount, e.currency ?? 'ARS'), 0);

  const getTotalIncome = (): number =>
    monthlyIncomes.reduce((sum, i) => sum + toARS(i.amount, i.currency ?? 'ARS'), 0);

  const getBalance = (): number => getTotalIncome() - getTotalExpenses();

  // Lógica de cuotas — cuánto pagar en un mes dado
  // Usa la misma lógica que monthlyExpenses para que los totales sean consistentes
  const getInstallmentSummary = (year: number, month: number, cardId?: string | 'all') => {
    // month es 0-indexed (igual que Date)
    const targetAbsMonth = year * 12 + month;
    const filtered = cardId && cardId !== 'all'
      ? expenses.filter(e => e.cardId === cardId)
      : expenses;
    return filtered.reduce((acc, expense) => {
      const inst = expense.installments ?? 1;
      const instAmount = expense.installmentAmount ?? parseFloat((expense.amount / inst).toFixed(2));

      if (inst === 1 && !expense.recurring) {
        // Contado: usa monthYear igual que monthlyExpenses
        const filterKey = expense.monthYear ?? expense.date.substring(0, 7);
        const [fy, fm] = filterKey.split('-');
        if (parseInt(fy) === year && parseInt(fm) - 1 === month) {
          acc.cash += expense.amount;
          acc.cashItems.push(expense);
        }
      } else if (inst > 1) {
        // Cuotas: misma lógica que monthlyExpenses (usa monthYear + currentInstallment)
        const curInst    = expense.currentInstallment ?? 1;
        const baseKey    = expense.monthYear ?? expense.date.substring(0, 7);
        const [bYearStr, bMonthStr] = baseKey.split('-');
        const baseAbsMonth  = parseInt(bYearStr) * 12 + (parseInt(bMonthStr) - 1);
        const firstAbsMonth = baseAbsMonth - (curInst - 1);
        const lastAbsMonth  = firstAbsMonth + (inst - 1);

        if (targetAbsMonth >= firstAbsMonth && targetAbsMonth <= lastAbsMonth) {
          const instForThisMonth = targetAbsMonth - firstAbsMonth + 1;
          acc.installments += instAmount;
          acc.installmentItems.push({
            ...expense,
            currentInstallment: instForThisMonth,
          });
        }
      }
      return acc;
    }, {
      cash: 0,
      installments: 0,
      cashItems: [] as Expense[],
      installmentItems: [] as (Expense & { currentInstallment: number })[],
    });
  };


  // --- ESTADO DE PRESUPUESTOS ---
  const getBudgetStatus = (): BudgetStatus[] => {
    return monthlyBudgets.map(b => {
      const cat = categories.find(c => c.id === b.categoryId);
      const spentAmount = monthlyExpenses
        .filter(e => e.categoryId === b.categoryId)
        .reduce((s, e) => s + toARS(e.amount, e.currency ?? 'ARS'), 0);
      const budgetAmount = b.amount;
      const remaining = budgetAmount - spentAmount;
      const percentageUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
      const threshold = b.alertThreshold ?? 80;
      const status: BudgetStatus['status'] =
        percentageUsed >= 100 ? 'exceeded' :
        percentageUsed >= threshold ? 'warning' : 'ok';
      return {
        budget: b,
        categoryName: cat?.name ?? null,
        budgetAmount,
        spentAmount,
        remaining,
        percentageUsed,
        status,
      };
    });
  };

  // --- COPIAR PRESUPUESTOS DEL MES ANTERIOR ---
  const copyBudgetsFromPreviousMonth = async (): Promise<number> => {
    const { year, month } = selectedMonth;
    const prevDate = new Date(year, month - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const curKey  = `${year}-${String(month + 1).padStart(2, '0')}`;

    const prevBudgets = budgets.filter(b => !b.recurring && b.monthYear === prevKey);
    const curBudgets  = budgets.filter(b => !b.recurring && b.monthYear === curKey);

    const toCreate = prevBudgets.filter(pb =>
      !curBudgets.some(cb => cb.name === pb.name && cb.categoryId === pb.categoryId)
    );

    await Promise.all(toCreate.map(pb =>
      addBudget({
        name: pb.name,
        categoryId: pb.categoryId ?? null,
        amount: pb.amount,
        period: pb.period,
        recurring: false,
        monthYear: curKey,
        alertThreshold: pb.alertThreshold,
      })
    ));

    return toCreate.length;
  };

  // --- AHORROS ---
  const addSaving = async (data: Omit<Saving, 'id'>) => {
    const newSaving = await apiCreateSaving(data);
    setSavings(prev => [...prev, newSaving]);
    toast.success('Ahorro agregado');
  };

  const updateSaving = async (id: string, data: Partial<Saving>) => {
    const updated = await apiUpdateSaving(id, data);
    setSavings(prev => prev.map(x => x.id === id ? updated : x));
    toast.success('Ahorro actualizado');
  };

  const deleteSaving = async (id: string) => {
    await apiDeleteSaving(id);
    setSavings(prev => prev.filter(x => x.id !== id));
    toast.success('Ahorro eliminado');
  };

  // --- TRANSACCIONES DE AHORRO ---
  const addSavingTransaction = async (data: Omit<SavingTransaction, 'id'>) => {
    const { transaction, newBalance } = await apiCreateSavingTransaction(data);
    setSavingTransactions(prev => [transaction, ...prev]);
    setSavings(prev => prev.map(s => s.id === data.savingId ? { ...s, balance: newBalance } : s));
    const label = data.type === 'withdrawal' ? 'Retiro registrado' : 'Depósito registrado';
    toast.success(label);
  };

  const deleteSavingTransaction = async (id: string) => {
    const t = savingTransactions.find(tx => tx.id === id);
    if (!t) return;
    const newBalance = await apiDeleteSavingTransaction(id, t.savingId, t.amount, t.type);
    setSavingTransactions(prev => prev.filter(tx => tx.id !== id));
    setSavings(prev => prev.map(s => s.id === t.savingId ? { ...s, balance: newBalance } : s));
    toast.success('Transacción eliminada');
  };

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

  // --- PLAZOS FIJOS ---
  const addFixedTerm = async (data: Omit<FixedTerm, 'id'>) => {
    const created = await apiCreateFixedTerm(data);
    setFixedTerms(prev => [...prev, created]);
    toast.success('Plazo fijo agregado');
  };

  const updateFixedTerm = async (id: string, data: Partial<FixedTerm>) => {
    const updated = await apiUpdateFixedTerm(id, data);
    setFixedTerms(prev => prev.map(x => x.id === id ? updated : x));
    toast.success('Plazo fijo actualizado');
  };

  const deleteFixedTerm = async (id: string) => {
    await apiDeleteFixedTerm(id);
    setFixedTerms(prev => prev.filter(x => x.id !== id));
    toast.success('Plazo fijo eliminado');
  };

  const getFixedTermStatus = (): FixedTermStatus[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return fixedTerms.map(ft => {
      const start = new Date(ft.startDate + 'T12:00:00');
      const end   = new Date(ft.endDate   + 'T12:00:00');
      const daysTotal     = Math.round((end.getTime() - start.getTime()) / 86400000);
      const elapsed       = Math.round((today.getTime() - start.getTime()) / 86400000);
      const daysElapsed   = Math.min(Math.max(0, elapsed), daysTotal);
      const daysRemaining = Math.round((end.getTime() - today.getTime()) / 86400000);
      // Interés simple: I = P * TNA/365 * días
      const dailyRate          = ft.rate / 100 / 365;
      const accruedInterest    = ft.principal * dailyRate * daysElapsed;
      const projectedInterest  = ft.principal * dailyRate * daysTotal;
      const currentValue       = ft.principal + accruedInterest;
      const isExpired          = daysRemaining < 0;
      const isExpiringSoon     = daysRemaining >= 0 && daysRemaining <= 7;
      return {
        fixedTerm: ft, daysElapsed, daysTotal, daysRemaining,
        accruedInterest, projectedInterest, currentValue, isExpired, isExpiringSoon,
      };
    });
  };

  // --- INVERSIONES ---
  const addInvestment = async (data: Omit<Investment, 'id'>) => {
    const created = await apiCreateInvestment(data);
    setInvestments(prev => [...prev, created]);
    toast.success('Inversión agregada');
  };

  const updateInvestment = async (id: string, data: Partial<Investment>) => {
    const updated = await apiUpdateInvestment(id, data);
    setInvestments(prev => prev.map(x => x.id === id ? updated : x));
    toast.success('Inversión actualizada');
  };

  const deleteInvestment = async (id: string) => {
    await apiDeleteInvestment(id);
    setInvestments(prev => prev.filter(x => x.id !== id));
    toast.success('Inversión eliminada');
  };

  const getInvestmentStatus = (): InvestmentStatus[] => {
    return investments.map(inv => {
      const purchaseValue    = inv.quantity * inv.purchasePrice;
      const currentValue     = inv.quantity * inv.currentPrice;
      const unrealizedGain   = currentValue - purchaseValue;
      const unrealizedGainPct = purchaseValue > 0 ? (unrealizedGain / purchaseValue) * 100 : 0;
      return { investment: inv, purchaseValue, currentValue, unrealizedGain, unrealizedGainPct };
    });
  };

  const getPortfolioSummary = (): PortfolioSummary => {
    const savingsSummary    = getSavingsSummary();
    const ftStatuses        = getFixedTermStatus();
    const invStatuses       = getInvestmentStatus();

    const fixedTermsTotalConverted = ftStatuses.reduce((sum, ft) => {
      const val = ft.currentValue;
      return sum + (ft.fixedTerm.currency === 'USD' ? val * (blue || 1) : val);
    }, 0);
    const fixedTermsProjectedInterest = ftStatuses.reduce((sum, ft) => {
      const val = ft.projectedInterest;
      return sum + (ft.fixedTerm.currency === 'USD' ? val * (blue || 1) : val);
    }, 0);

    const investmentsTotalConverted = invStatuses.reduce((sum, inv) => {
      const val = inv.currentValue;
      return sum + (inv.investment.currency === 'USD' ? val * (blue || 1) : val);
    }, 0);
    const investmentsTotalGain = invStatuses.reduce((sum, inv) => {
      const val = inv.unrealizedGain;
      return sum + (inv.investment.currency === 'USD' ? val * (blue || 1) : val);
    }, 0);

    return {
      savingsTotalConverted:    savingsSummary.totalConverted,
      fixedTermsTotalConverted,
      fixedTermsProjectedInterest,
      investmentsTotalConverted,
      investmentsTotalGain,
      grandTotal: savingsSummary.totalConverted + fixedTermsTotalConverted + investmentsTotalConverted,
    };
  };

  // --- AHORRO AUTOMÁTICO ---
  const createAutoSavingRule = async (r: Omit<AutoSavingRule, 'id'>) => {
    const newRule = await apiCreateAutoSavingRule(r);
    setAutoSavingRules(prev => [...prev, newRule]);
  };

  const updateAutoSavingRule = async (id: string, updates: Partial<AutoSavingRule>) => {
    const updated = await apiUpdateAutoSavingRule(id, updates);
    setAutoSavingRules(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteAutoSavingRule = async (id: string) => {
    await apiDeleteAutoSavingRule(id);
    setAutoSavingRules(prev => prev.filter(x => x.id !== id));
  };

  const getMatchingRule = (categoryId: string | null | undefined): AutoSavingRule | undefined => {
    if (!categoryId) return undefined;
    return autoSavingRules.find(r => r.isActive && r.categoryId === categoryId);
  };

  const applyAutoSaving = async (income: Income, rule: AutoSavingRule, status: AutoSavingLogStatus) => {
    const savedAmount = Math.round(income.amount * (rule.percentage / 100) * 100) / 100;

    if (status !== 'declined') {
      await addSavingTransaction({
        savingId: rule.targetSavingId,
        type: 'deposit',
        amount: savedAmount,
        date: income.date,
        notes: `Ahorro automático - ${income.name}`,
        sourceIncomeId: income.id,
      });
      const updatedRule = await apiUpdateAutoSavingRule(rule.id, {
        lastApplied: new Date().toISOString(),
        totalSaved: (rule.totalSaved ?? 0) + savedAmount,
      });
      setAutoSavingRules(prev => prev.map(x => x.id === rule.id ? updatedRule : x));
    }

    const log = await apiCreateAutoSavingLog({
      ruleId: rule.id,
      incomeId: income.id,
      incomeName: income.name,
      incomeAmount: income.amount,
      savedAmount,
      percentage: rule.percentage,
      targetSavingId: rule.targetSavingId,
      targetSavingName: rule.targetSavingName,
      status,
      createdAt: new Date().toISOString(),
    });
    setAutoSavingLogs(prev => [log, ...prev]);
  };

  // Proyección de N meses: empieza 1 mes antes del mes seleccionado
  // Resultado: [mes anterior, mes seleccionado, +1, +2, ..., +6] = 8 meses
  const getMonthlyProjection = (months: number = 8, cardId?: string | 'all') => {
    const { year, month } = selectedMonth;
    // Offset -1 para incluir 1 mes previo al seleccionado
    return Array.from({ length: months }, (_, i) => {
      const date = new Date(year, month - 1 + i, 1);
      const label = date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
      const summary = getInstallmentSummary(date.getFullYear(), date.getMonth(), cardId);
      return {
        label,
        year: date.getFullYear(),
        month: date.getMonth(),
        total: summary.cash + summary.installments,
        cash: summary.cash,
        installments: summary.installments,
      };
    });
  };


  return (
    <FinanceContext.Provider
      value={{
        cards,
        addCard,
        updateCard,
        deleteCard,
        getInstallmentSummary,
        getMonthlyProjection,
        expenses,
        incomes,
        budgets,
        categories,
        monthlyIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addIncome,
        updateIncome,
        deleteIncome,
        addBudget,
        updateBudget,
        deleteBudget,
        addCategory,
        updateCategory,
        deleteCategory,
        hideCategory,
        restoreCategory,
        getAllCategories,
        suggestCategory,
        setMonthlyIncome: setMonthly,
        getCategoriesByType,
        getRemainingBudget,
        getTotalExpenses,
        getTotalIncome,
        getBalance,
        selectedMonth,
        setSelectedMonth,
        monthlyExpenses,
        monthlyIncomes,
        monthlyBudgets,
        getBudgetStatus,
        copyBudgetsFromPreviousMonth,
        savings,
        addSaving,
        updateSaving,
        deleteSaving,
        getSavingsSummary,
        savingTransactions,
        addSavingTransaction,
        deleteSavingTransaction,
        fixedTerms,
        addFixedTerm,
        updateFixedTerm,
        deleteFixedTerm,
        getFixedTermStatus,
        investments,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        getInvestmentStatus,
        getPortfolioSummary,
        dataLoading: false,
        autoSavingRules,
        autoSavingLogs,
        createAutoSavingRule,
        updateAutoSavingRule,
        deleteAutoSavingRule,
        applyAutoSaving,
        getMatchingRule,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};