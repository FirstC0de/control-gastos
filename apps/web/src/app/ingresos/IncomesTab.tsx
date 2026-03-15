'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { Income, Currency } from '@controlados/shared';
import CategorySelector from '../components/categories/CategorySelector';
import CategoriesModal from '../components/categories/CategoriesModal';
import RecurringToggle from '../components/ui/RecurringToggle';
import ConfirmModal from '../components/ui/ConfirmModal';
import BulkActionBar from '../components/ui/BulkActionBar';
import AutoSavingSuggestionModal from '../components/AutoSavingSuggestionToast';
import { toast } from 'sonner';
import type { AutoSavingRule, Income as IncomeType } from '@controlados/shared';

const inputClass = "w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const INCOME_TYPES: { value: Income['type']; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'sales',   label: 'Ventas'  },
  { value: 'other',   label: 'Otros'   },
];

const INCOME_DEFAULT: Omit<Income, 'id'> = {
  name: '', amount: 0, type: 'monthly',
  date: new Date().toISOString().split('T')[0],
  categoryId: null, currency: 'ARS',
  recurring: false, recurringDay: undefined,
};

export default function IncomesTab() {
  const {
    monthlyIncomes, addIncome, updateIncome, deleteIncome,
    categories, selectedMonth, savings, addSavingTransaction,
    getMatchingRule, applyAutoSaving,
  } = useFinance();
  const incomes = monthlyIncomes;
  const { blue } = useExchangeRate();
  const defaultDate = `${selectedMonth.year}-${String(selectedMonth.month + 1).padStart(2, '0')}-01`;
  const [form, setForm]                       = useState<Omit<Income, 'id'>>({ ...INCOME_DEFAULT, date: defaultDate });
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [showCatModal, setShowCatModal]       = useState(false);

  // Sugerencia de ahorro automático
  const [savingSuggestion, setSavingSuggestion] = useState<{
    income: IncomeType;
    rule: AutoSavingRule;
    savingName: string;
  } | null>(null);

  // Aportar al ahorro
  const [savingEnabled,   setSavingEnabled]   = useState(false);
  const [savingAccountId, setSavingAccountId] = useState<string>('');
  const [savingAmount,    setSavingAmount]    = useState('');

  const reset = () => {
    setForm({ ...INCOME_DEFAULT, date: defaultDate });
    setEditingId(null);
    setSavingEnabled(false);
    setSavingAmount('');
    setSavingAccountId('');
  };

  const handleSubmit = async () => {
    if (!form.name || !form.amount) { toast.error('Nombre y monto son requeridos'); return; }
    setLoading(true);
    try {
      if (editingId) {
        await updateIncome(editingId, form);
      } else {
        const newIncome = await addIncome(form);

        // Aportar al ahorro manual si está habilitado
        if (savingEnabled && savingAccountId && savingAmount) {
          const amt = parseFloat(savingAmount.replace(',', '.'));
          if (!isNaN(amt) && amt > 0) {
            await addSavingTransaction({
              savingId: savingAccountId,
              type: 'deposit',
              amount: amt,
              date: form.date,
              notes: `Aporte desde ingreso: ${form.name}`,
            });
          }
        }

        // Detectar regla de ahorro automático
        const rule = getMatchingRule(form.categoryId);
        if (rule) {
          const saving = savings.find(s => s.id === rule.targetSavingId);
          const savingName = saving?.name ?? rule.targetSavingName ?? 'Cuenta de ahorro';

          if (!rule.askEveryTime) {
            // Aplicar automáticamente y mostrar toast informativo
            await applyAutoSaving(newIncome, rule, 'auto_applied');
            const savedAmount = Math.round(newIncome.amount * (rule.percentage / 100));
            toast.success(`Ahorro automático aplicado: $${savedAmount.toLocaleString('es-AR')}`, {
              description: `Depositado en ${savingName}`,
              duration: 6000,
            });
          } else {
            // Mostrar popup centrado con sugerencia
            setSavingSuggestion({ income: newIncome, rule, savingName });
          }
        }
      }
      reset();
    } catch { toast.error('Error al guardar ingreso'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteIncome(deletingId);
      setDeletingId(null);
    } catch { toast.error('Error al eliminar ingreso'); }
  };

  const startEdit = (income: Income) => {
    setEditingId(income.id);
    setForm({
      name:         income.name,
      amount:       income.amount,
      type:         income.type,
      date:         income.date,
      categoryId:   income.categoryId ?? null,
      currency:     income.currency ?? 'ARS',
      recurring:    income.recurring ?? false,
      recurringDay: income.recurringDay,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Bulk ──────────────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectMode, setSelectMode]     = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.size === incomes.length ? new Set() : new Set(incomes.map(i => i.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setSelectMode(false); };

  const handleBulkDelete = async () => {
    try {
      await Promise.all([...selectedIds].map(id => deleteIncome(id)));
      clearSelection();
    } catch { toast.error('Error al eliminar'); }
    finally { setBulkDeleting(false); }
  };

  const handleBulkCategory = async (categoryId: string | null) => {
    try {
      await Promise.all([...selectedIds].map(id => updateIncome(id, { categoryId: categoryId ?? undefined })));
      clearSelection();
    } catch { toast.error('Error al actualizar'); }
  };

  const allSelected  = incomes.length > 0 && selectedIds.size === incomes.length;
  const someSelected = selectedIds.size > 0;

  const fmtAmount = (income: Income) => {
    if (income.currency === 'USD') return (
      <div>
        <p className="text-sm font-semibold font-mono tabular-nums text-emerald-700">
          U$D {income.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </p>
        {blue > 0 && (
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            ≈ ${(income.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
        )}
      </div>
    );
    return (
      <p className="text-sm font-semibold font-mono tabular-nums text-slate-900">
        ${income.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
      </p>
    );
  };

  return (
    <>
      <section className="space-y-6">

        {/* ── Formulario ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-2 -mx-6 -mt-6 px-6 py-4 mb-6 rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50 border-b border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900 tracking-tight">
              {editingId ? 'Editar ingreso' : 'Nuevo ingreso'}
            </h2>
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white/70 hover:bg-white rounded-xl transition-colors shrink-0"
            >
              <TagIcon />
              <span className="hidden sm:inline">Gestionar categorías</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nombre */}
            <div>
              <label className={labelClass}>Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Sueldo, Freelance..."
                className={inputClass}
              />
            </div>

            {/* Monto */}
            <div>
              <label className={labelClass}>Monto *</label>
              <div className="flex gap-2">
                <select
                  value={form.currency ?? 'ARS'}
                  onChange={e => setForm(p => ({ ...p, currency: e.target.value as Currency }))}
                  className="px-2 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
                >
                  <option value="ARS">$</option>
                  <option value="USD">U$D</option>
                </select>
                <input
                  type="number"
                  value={form.amount || ''}
                  onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </div>
              {form.currency === 'USD' && form.amount > 0 && blue > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  ≈ ${(form.amount * blue).toLocaleString('es-AR', { maximumFractionDigits: 0 })} ARS (blue)
                </p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value as Income['type'] }))}
                className={inputClass}
              >
                {INCOME_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className={inputClass}
              />
            </div>

            {/* Categoría */}
            <div>
              <label className={labelClass}>Categoría</label>
              <CategorySelector
                value={form.categoryId ?? null}
                onChange={id => setForm(p => ({ ...p, categoryId: id }))}
                categoryType="income"
                suggestionText={form.name}
                className={inputClass}
                showManageButton={false}
              />
            </div>

            {/* Día recurrente (solo si recurring) */}
            {form.recurring && (
              <div>
                <label className={labelClass}>Día del mes</label>
                <input
                  type="number"
                  min={1} max={28}
                  value={form.recurringDay ?? 1}
                  onChange={e => setForm(p => ({ ...p, recurringDay: Math.min(28, Math.max(1, Number(e.target.value))) }))}
                  className={inputClass}
                  placeholder="1"
                />
                <p className="text-xs text-slate-400 mt-1">Se mostrará cada mes en este día</p>
              </div>
            )}
          </div>

          {/* Toggle recurrente */}
          <div className="mt-4 sm:max-w-sm">
            <RecurringToggle
              value={form.recurring ?? false}
              onChange={v => setForm(p => ({ ...p, recurring: v, recurringDay: v ? (p.recurringDay ?? 1) : undefined }))}
              labelOn="Recurrente (mensual)"
              labelOff="Ingreso puntual"
              descOn="Aparece automáticamente cada mes"
              descOff="Solo para el mes seleccionado"
            />
          </div>

          {/* Aportar al ahorro */}
          {!editingId && savings.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => { setSavingEnabled(v => !v); setSavingAmount(''); setSavingAccountId(''); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  savingEnabled
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Aportar al ahorro
                {savingEnabled && (
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              {savingEnabled && (
                <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <div>
                    <label className={labelClass}>Cuenta de ahorro</label>
                    <select
                      value={savingAccountId}
                      onChange={e => setSavingAccountId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Seleccioná...</option>
                      {savings.filter(s => s.currency === (form.currency ?? 'ARS')).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Monto a aportar</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={savingAmount}
                      onChange={e => setSavingAmount(e.target.value)}
                      placeholder="0.00"
                      className={inputClass}
                    />
                    {form.amount > 0 && savingAmount && (
                      <p className="text-[10px] text-emerald-600 mt-1">
                        {((parseFloat(savingAmount) / form.amount) * 100).toFixed(0)}% del ingreso
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="mt-5 flex justify-end gap-2">
            {editingId && (
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? 'Guardando...' : editingId ? 'Actualizar ingreso' : 'Agregar ingreso'}
            </button>
          </div>
        </div>

        {/* ── Lista ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200">
          <div className="px-6 py-4 border-b border-indigo-100 flex items-center gap-3 rounded-t-2xl bg-linear-to-r from-indigo-50 to-slate-50">
            <div className="w-6 shrink-0">
              {selectMode && (
                <div
                  onClick={toggleSelectAll}
                  className={`w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                    allSelected ? 'bg-indigo-600 border-indigo-600'
                    : someSelected ? 'bg-indigo-200 border-indigo-400'
                    : 'border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {allSelected   && <span className="text-white text-xs">✓</span>}
                  {!allSelected && someSelected && <span className="text-indigo-600 text-xs font-bold">−</span>}
                </div>
              )}
            </div>
            <h2 className="flex-1 text-lg font-bold text-indigo-900 tracking-tight">Ingresos</h2>
            <button
              onClick={() => selectMode ? clearSelection() : setSelectMode(true)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectMode ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {selectMode ? '✕ Cancelar' : '☑ Seleccionar'}
            </button>
          </div>

          {incomes.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-sm font-medium text-slate-500">No hay ingresos registrados</p>
              <p className="text-xs text-slate-400 mt-1">Agregá tu primer ingreso usando el formulario de arriba</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {incomes.map(income => {
                const cat        = categories.find(c => c.id === income.categoryId);
                const isSelected = selectedIds.has(income.id);

                return (
                  <li
                    key={income.id}
                    className={`px-6 py-3.5 transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50/70'}`}
                  >
                    <div className="flex items-center gap-3">
                      {selectMode && (
                        <div
                          onClick={() => toggleSelect(income.id)}
                          className={`w-5 h-5 rounded border-2 cursor-pointer shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'
                          }`}
                        >
                          {isSelected && <span className="text-white text-xs">✓</span>}
                        </div>
                      )}

                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat?.color || '#cbd5e1' }} />

                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate leading-tight">{income.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-xs text-slate-400">
                              {new Date(income.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize">
                              {INCOME_TYPES.find(t => t.value === income.type)?.label}
                            </span>
                            {cat && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: cat.color + '18', color: cat.color }}>
                                {cat.name}
                              </span>
                            )}
                            {income.currency === 'USD' && (
                              <span className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium border border-emerald-100">
                                USD
                              </span>
                            )}
                            {income.recurring && (
                              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-medium border border-indigo-100">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Recurrente
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={`shrink-0 text-right ${!selectMode ? 'flex items-center gap-2' : ''}`}>
                          <div>{fmtAmount(income)}</div>
                          {!selectMode && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEdit(income)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >✏️</button>
                              <button
                                onClick={() => setDeletingId(income.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >🗑️</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <CategoriesModal
        isOpen={showCatModal}
        onClose={() => setShowCatModal(false)}
        defaultType="income"
      />
      <BulkActionBar
        selectedCount={selectedIds.size}
        entityType="incomes"
        onDeleteAll={() => setBulkDeleting(true)}
        onChangeCategoryAll={handleBulkCategory}
        onClearSelection={clearSelection}
      />
      <ConfirmModal
        isOpen={bulkDeleting}
        title="Eliminar ingresos"
        message={`¿Eliminar los ${selectedIds.size} ingresos seleccionados? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar todos"
        danger
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />
      <ConfirmModal
        isOpen={!!deletingId}
        title="Eliminar ingreso"
        message={`¿Eliminar "${incomes.find(i => i.id === deletingId)?.name}"?`}
        confirmLabel="Eliminar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />

      {/* Popup de sugerencia de ahorro automático */}
      {savingSuggestion && (
        <AutoSavingSuggestionModal
          income={savingSuggestion.income}
          rule={savingSuggestion.rule}
          savingName={savingSuggestion.savingName}
          onAccept={async () => {
            await applyAutoSaving(savingSuggestion.income, savingSuggestion.rule, 'accepted');
            const saved = Math.round(savingSuggestion.income.amount * (savingSuggestion.rule.percentage / 100));
            setSavingSuggestion(null);
            toast.success(`Ahorro guardado: $${saved.toLocaleString('es-AR')}`, { icon: '✅' });
          }}
          onDecline={() => {
            applyAutoSaving(savingSuggestion.income, savingSuggestion.rule, 'declined').catch(console.error);
            setSavingSuggestion(null);
          }}
        />
      )}
    </>
  );
}
