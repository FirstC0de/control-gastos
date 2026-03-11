import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, getDoc, setDoc, query, orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Expense, Income, Budget, Category, Card } from './types';

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