import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, getDoc, setDoc, query, orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Expense, Income, Budget, Category, Card, Saving, SavingTransaction, SavingTransactionType, FixedTerm, Investment, AutoSavingRule, AutoSavingLog } from './types';

// Helper para obtener uid — lanza error claro si no hay sesión
const getUid = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Usuario no autenticado');
  return uid;
};

// Helper para eliminar campos undefined antes de enviar a Firestore
const cleanUndefined = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;

// ── GASTOS ────────────────────────────────────────────────
export const fetchExpenses = async (): Promise<Expense[]> => {
  const uid = getUid();
  const q = query(collection(db, 'users', uid, 'expenses'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
};

export const createExpense = async (e: Omit<Expense, 'id'>): Promise<Expense> => {
  const uid = getUid();
  const data = cleanUndefined(e); // ← limpia cardId, categoryId, etc.
  const ref = await addDoc(collection(db, 'users', uid, 'expenses'), data);
  return { id: ref.id, ...e };
};

export const updateExpense = async (id: string, updates: Partial<Expense>): Promise<Expense> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'expenses', id);
  await updateDoc(ref, cleanUndefined(updates)); // ← mismo fix
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Expense;
};
export const deleteExpense = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'expenses', id));
};

// ── INGRESOS ──────────────────────────────────────────────
export const fetchIncomes = async (): Promise<Income[]> => {
  const uid = getUid();
  const q = query(collection(db, 'users', uid, 'incomes'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Income));
};

export const createIncome = async (i: Omit<Income, 'id'>): Promise<Income> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'incomes'), cleanUndefined(i)); // ← categoryId puede ser undefined
  return { id: ref.id, ...i };
};

export const updateIncome = async (id: string, updates: Partial<Income>): Promise<Income> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'incomes', id);
  await updateDoc(ref, cleanUndefined(updates)); // ←
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Income;
};


export const deleteIncome = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'incomes', id));
};

// ── PRESUPUESTOS ──────────────────────────────────────────
export const fetchBudgets = async (): Promise<Budget[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'budgets'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
};

export const createBudget = async (b: Omit<Budget, 'id'>): Promise<Budget> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'budgets'), cleanUndefined(b)); // ← categoryId, spent pueden ser undefined
  return { id: ref.id, ...b };
};
export const updateBudget = async (id: string, updates: Partial<Budget>): Promise<Budget> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'budgets', id);
  await updateDoc(ref, cleanUndefined(updates)); // ←
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Budget;
};

export const deleteBudget = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'budgets', id));
};

// ── CATEGORÍAS ────────────────────────────────────────────
export const fetchCategories = async (): Promise<Category[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
};

export const createCategory = async (c: Omit<Category, 'id'>): Promise<Category> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'categories'), cleanUndefined(c)); // ← icon es opcional
  return { id: ref.id, ...c };
};


export const updateCategory = async (id: string, updates: Partial<Category>): Promise<Category> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'categories', id);
  await updateDoc(ref, cleanUndefined(updates)); // ←
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'categories', id));
};

export const hideCategory = async (id: string): Promise<void> => {
  const uid = getUid();
  await updateDoc(doc(db, 'users', uid, 'categories', id), { isActive: false });
};

export const restoreCategory = async (id: string): Promise<void> => {
  const uid = getUid();
  await updateDoc(doc(db, 'users', uid, 'categories', id), { isActive: true });
};

// ── SEED CATEGORÍAS PREDEFINIDAS ──────────────────────────
export const checkAndSeedCategories = async (): Promise<boolean> => {
  const uid = getUid();
  const metaRef = doc(db, 'users', uid, 'config', 'categoriesMeta');
  const metaSnap = await getDoc(metaRef);
  if (metaSnap.exists() && metaSnap.data().seeded) return false;

  const { ALL_DEFAULT_CATEGORIES } = await import('./defaultCategories');
  await Promise.all(
    ALL_DEFAULT_CATEGORIES.map(cat =>
      addDoc(collection(db, 'users', uid, 'categories'), {
        ...cat,
        createdAt: new Date().toISOString(),
      })
    )
  );
  await setDoc(metaRef, { seeded: true, seededAt: new Date().toISOString() });
  return true;
};

// ── INGRESO MENSUAL ───────────────────────────────────────
export const fetchMonthlyIncome = async (): Promise<number> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'config', 'monthlyIncome');
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().amount as number) : 0;
};

export const updateMonthlyIncome = async (amount: number): Promise<number> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'config', 'monthlyIncome');
  await setDoc(ref, { amount });
  return amount;
};

// ── TARJETAS ──────────────────────────────────────────────
export const fetchCards = async (): Promise<Card[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'cards'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Card));
};

export const createCard = async (c: Omit<Card, 'id'>): Promise<Card> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'cards'), cleanUndefined(c)); // ← lastFour es opcional
  return { id: ref.id, ...c };
};

export const updateCard = async (id: string, updates: Partial<Card>): Promise<Card> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'cards', id);
  await updateDoc(ref, cleanUndefined(updates)); // ←
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Card;
};

export const deleteCard = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'cards', id));
};

// ── AHORROS ───────────────────────────────────────────────
export const fetchSavings = async (): Promise<Saving[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'savings'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Saving));
};

export const createSaving = async (s: Omit<Saving, 'id'>): Promise<Saving> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'savings'), cleanUndefined(s));
  return { id: ref.id, ...s };
};

export const updateSaving = async (id: string, updates: Partial<Saving>): Promise<Saving> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'savings', id);
  await updateDoc(ref, cleanUndefined(updates));
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Saving;
};

export const deleteSaving = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'savings', id));
};

// ── TRANSACCIONES DE AHORRO ───────────────────────────────
export const fetchSavingTransactions = async (): Promise<SavingTransaction[]> => {
  const uid = getUid();
  const q = query(collection(db, 'users', uid, 'savings_transactions'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingTransaction));
};

export const createSavingTransaction = async (t: Omit<SavingTransaction, 'id'>): Promise<{ transaction: SavingTransaction; newBalance: number }> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'savings_transactions'), cleanUndefined(t));
  // Update saving balance atomically
  const savingRef = doc(db, 'users', uid, 'savings', t.savingId);
  const savingSnap = await getDoc(savingRef);
  const currentBalance = savingSnap.exists() ? (savingSnap.data().balance as number) : 0;
  const delta = t.type === 'withdrawal' ? -t.amount : t.amount;
  const newBalance = currentBalance + delta;
  await updateDoc(savingRef, { balance: newBalance });
  return { transaction: { id: ref.id, ...t }, newBalance };
};

export const deleteSavingTransaction = async (
  id: string, savingId: string, amount: number, type: SavingTransactionType
): Promise<number> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'savings_transactions', id));
  // Reverse balance change
  const savingRef = doc(db, 'users', uid, 'savings', savingId);
  const savingSnap = await getDoc(savingRef);
  const currentBalance = savingSnap.exists() ? (savingSnap.data().balance as number) : 0;
  const delta = type === 'withdrawal' ? amount : -amount;
  const newBalance = currentBalance + delta;
  await updateDoc(savingRef, { balance: newBalance });
  return newBalance;
};

// ── PLAZOS FIJOS ──────────────────────────────────────────
export const fetchFixedTerms = async (): Promise<FixedTerm[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'fixed_terms'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FixedTerm));
};

export const createFixedTerm = async (ft: Omit<FixedTerm, 'id'>): Promise<FixedTerm> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'fixed_terms'), cleanUndefined(ft));
  return { id: ref.id, ...ft };
};

export const updateFixedTerm = async (id: string, updates: Partial<FixedTerm>): Promise<FixedTerm> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'fixed_terms', id);
  await updateDoc(ref, cleanUndefined(updates));
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as FixedTerm;
};

export const deleteFixedTerm = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'fixed_terms', id));
};

// ── INVERSIONES ───────────────────────────────────────────
export const fetchInvestments = async (): Promise<Investment[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'investments'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Investment));
};

export const createInvestment = async (inv: Omit<Investment, 'id'>): Promise<Investment> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'investments'), cleanUndefined(inv));
  return { id: ref.id, ...inv };
};

export const updateInvestment = async (id: string, updates: Partial<Investment>): Promise<Investment> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'investments', id);
  await updateDoc(ref, cleanUndefined(updates));
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Investment;
};

export const deleteInvestment = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'investments', id));
};

// ── REGLAS DE AHORRO AUTOMÁTICO ───────────────────────
export const fetchAutoSavingRules = async (): Promise<AutoSavingRule[]> => {
  const uid = getUid();
  const snap = await getDocs(collection(db, 'users', uid, 'auto_saving_rules'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutoSavingRule));
};

export const createAutoSavingRule = async (r: Omit<AutoSavingRule, 'id'>): Promise<AutoSavingRule> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'auto_saving_rules'), cleanUndefined(r));
  return { id: ref.id, ...r };
};

export const updateAutoSavingRule = async (id: string, updates: Partial<AutoSavingRule>): Promise<AutoSavingRule> => {
  const uid = getUid();
  const ref = doc(db, 'users', uid, 'auto_saving_rules', id);
  await updateDoc(ref, cleanUndefined(updates));
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as AutoSavingRule;
};

export const deleteAutoSavingRule = async (id: string): Promise<void> => {
  const uid = getUid();
  await deleteDoc(doc(db, 'users', uid, 'auto_saving_rules', id));
};

// ── HISTORIAL DE AHORRO AUTOMÁTICO ────────────────────
export const fetchAutoSavingLogs = async (): Promise<AutoSavingLog[]> => {
  const uid = getUid();
  const q = query(collection(db, 'users', uid, 'auto_saving_logs'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutoSavingLog));
};

export const createAutoSavingLog = async (l: Omit<AutoSavingLog, 'id'>): Promise<AutoSavingLog> => {
  const uid = getUid();
  const ref = await addDoc(collection(db, 'users', uid, 'auto_saving_logs'), cleanUndefined(l));
  return { id: ref.id, ...l };
};