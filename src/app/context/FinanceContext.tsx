'use client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  updateCategory as apiUpdateCategory, // ← nuevo
  deleteCategory as apiDeleteCategory,
  fetchMonthlyIncome,
  updateMonthlyIncome as apiUpdateMonthlyIncome,
  fetchCards,
  createCard as apiCreateCard,
  updateCard as apiUpdateCard,
  deleteCard as apiDeleteCard,
} from '../lib/api';
import {
  Expense,
  Income,
  Budget,
  Category,
  CategoryType,
  FinanceContextType,
  Card,
  Currency
} from '../lib/types';



const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [cards, setCards] = useState<Card[]>([]);
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
        fetchCategories().then(setCategories).catch(console.error);
        fetchMonthlyIncome().then(setMonthlyIncome).catch(console.error);
        fetchCards().then(setCards).catch(console.error);
      } else {
        setExpenses([]);
        setIncomes([]);
        setBudgets([]);
        setCategories([]);
        setMonthlyIncome(0);
        setCards([]);
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
    return expenses.reduce<Expense[]>((acc, e) => {
      if (e.recurring) {
        const d = new Date(e.date + 'T12:00:00');
        if (year > d.getFullYear() || (year === d.getFullYear() && month >= d.getMonth())) {
          const day = e.recurringDay ?? d.getDate();
          acc.push({
            ...e,
            date: `${key}-${String(Math.min(day, 28)).padStart(2, '0')}`,
          });
        }
      } else {
        // Usar monthYear si existe (gastos importados de PDF), sino usar date
        const filterKey = e.monthYear ?? e.date.substring(0, 7);
        if (filterKey === key) acc.push(e);
      }
      return acc;
    }, []);
  }, [expenses, selectedMonth]);

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
  const addCard = async (c: Omit<Card, 'id'>) => {
    const newCard = await apiCreateCard(c);
    setCards(prev => [...prev, newCard]);
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
  const addExpense = async (e: Omit<Expense, 'id'>) => {
    const newExp = await apiCreateExpense(e);
    setExpenses(prev => [...prev, newExp]);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const updated = await apiUpdateExpense(id, updates); // ← viene de lib/api.ts
    setExpenses(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteExpense = async (id: string) => {
    await apiDeleteExpense(id);
    setExpenses(prev => prev.filter(x => x.id !== id));
  };

  // --- INGRESOS ---
  const addIncome = async (i: Omit<Income, 'id'>) => {
    const newInc = await apiCreateIncome(i);
    setIncomes(prev => [...prev, newInc]);
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const updated = await apiUpdateIncome(id, updates);
    setIncomes(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteIncome = async (id: string) => {
    await apiDeleteIncome(id);
    setIncomes(prev => prev.filter(x => x.id !== id));
  };

  // --- PRESUPUESTOS ---
  const addBudget = async (b: Omit<Budget, 'id'>) => {
    const newBud = await apiCreateBudget(b);
    setBudgets(prev => [...prev, newBud]);
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const updated = await apiUpdateBudget(id, updates);
    setBudgets(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteBudget = async (id: string) => {
    await apiDeleteBudget(id);
    setBudgets(prev => prev.filter(x => x.id !== id));
  };

  // --- CATEGORÍAS ---
  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newCat = await apiCreateCategory(c);
    setCategories(prev => [...prev, newCat]);
  };

  // Y updateCategory que antes no persistía:
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await apiUpdateCategory(id, updates); // ← ahora sí persiste
    setCategories(prev => prev.map(x => x.id === id ? updated : x));
  };

  const deleteCategory = async (id: string) => {
    await apiDeleteCategory(id);
    setCategories(prev => prev.filter(x => x.id !== id));
  };

  // --- INGRESO MENSUAL ---
  const setMonthly = async (amt: number) => {
    const updatedAmt = await apiUpdateMonthlyIncome(amt);
    setMonthlyIncome(updatedAmt);
  };

  // --- MÉTODOS ÚTILES ---
  const getCategoriesByType = (type: CategoryType) =>
    categories.filter(c => c.type === 'both' || c.type === type);

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
  const getInstallmentSummary = (year: number, month: number, cardId?: string | 'all') => {
    // month es 0-indexed (igual que Date)
    const filtered = cardId && cardId !== 'all'
      ? expenses.filter(e => e.cardId === cardId)
      : expenses;
    return filtered.reduce((acc, expense) => {
      const expenseDate = new Date(expense.date);
      const inst = expense.installments ?? 1;
      const instAmount = expense.installmentAmount ?? expense.amount;


      if (inst === 1) {
        // Contado: solo aparece en su mes
        if (expenseDate.getFullYear() === year && expenseDate.getMonth() === month) {
          acc.cash += expense.amount;
          acc.cashItems.push(expense);
        }
      } else {
        // Cuotas: calcular cuál cuota cae en targetDate
        const monthsDiff =
          (year - expenseDate.getFullYear()) * 12 +
          (month - expenseDate.getMonth());

        const installmentIndex = 1 + monthsDiff; // cuota 1 arranca en la fecha de compra
        if (installmentIndex >= 1 && installmentIndex <= inst) {
          acc.installments += instAmount;
          acc.installmentItems.push({
            ...expense,
            currentInstallment: installmentIndex,
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


  // Proyección de los próximos N meses
  const getMonthlyProjection = (months: number = 6, cardId?: string | 'all') => {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
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