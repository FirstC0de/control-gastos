'use client';

import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import AutoSavingRuleModal from '../components/AutoSavingRuleModal';
import type { AutoSavingRule } from '@controlados/shared';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  accepted:     { label: 'Aceptado',   className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  declined:     { label: 'Rechazado',  className: 'bg-rose-50 text-rose-700 border-rose-100' },
  auto_applied: { label: 'Automático', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
};

export default function AutoSavingTab() {
  const {
    autoSavingRules,
    autoSavingLogs,
    updateAutoSavingRule,
    deleteAutoSavingRule,
    categories,
    savings,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoSavingRule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const openCreate = () => { setEditingRule(null); setModalOpen(true); };
  const openEdit   = (rule: AutoSavingRule) => { setEditingRule(rule); setModalOpen(true); };

  const handleToggleActive = async (rule: AutoSavingRule) => {
    await updateAutoSavingRule(rule.id, { isActive: !rule.isActive });
  };

  const handleDelete = async (id: string) => {
    await deleteAutoSavingRule(id);
    setDeletingId(null);
  };

  const activeRules  = autoSavingRules.filter(r => r.isActive);
  const pausedRules  = autoSavingRules.filter(r => !r.isActive);
  const recentLogs   = autoSavingLogs.slice(0, 20);

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name ?? id;
  const getSavingName   = (id: string) => savings.find(s => s.id === id)?.name ?? id;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });

  const fmtAmount = (n: number) =>
    '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 });

  return (
    <section className="space-y-6">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-600 rounded-lg inline-flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              Ahorro automático
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Configurá reglas para ahorrar automáticamente al recibir ingresos
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva regla
          </button>
        </div>

        {/* Stats */}
        {autoSavingRules.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{activeRules.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Reglas activas</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-2xl font-bold text-emerald-700 font-mono">
                {fmtAmount(autoSavingRules.reduce((s, r) => s + (r.totalSaved ?? 0), 0))}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Total ahorrado</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{autoSavingLogs.filter(l => l.status !== 'declined').length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Depósitos realizados</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Reglas activas ─────────────────────────────── */}
      {autoSavingRules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-14 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">🏦</div>
          <p className="text-base font-semibold text-slate-700">Sin reglas configuradas</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            Creá una regla para que la app sugiera ahorrar automáticamente cuando registrás un ingreso
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Crear primera regla
          </button>
        </div>
      ) : (
        <>
          {/* Reglas activas */}
          {activeRules.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h3 className="text-sm font-bold text-slate-800">Reglas activas</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {activeRules.map(rule => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    categoryName={rule.categoryName ?? getCategoryName(rule.categoryId)}
                    savingName={rule.targetSavingName ?? getSavingName(rule.targetSavingId)}
                    onEdit={() => openEdit(rule)}
                    onToggle={() => handleToggleActive(rule)}
                    onDelete={() => setDeletingId(rule.id)}
                    fmtDate={fmtDate}
                    fmtAmount={fmtAmount}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Reglas pausadas */}
          {pausedRules.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden opacity-70">
              <div className="px-6 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500">Reglas pausadas</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {pausedRules.map(rule => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    categoryName={rule.categoryName ?? getCategoryName(rule.categoryId)}
                    savingName={rule.targetSavingName ?? getSavingName(rule.targetSavingId)}
                    onEdit={() => openEdit(rule)}
                    onToggle={() => handleToggleActive(rule)}
                    onDelete={() => setDeletingId(rule.id)}
                    fmtDate={fmtDate}
                    fmtAmount={fmtAmount}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* ── Historial ──────────────────────────────────── */}
      {recentLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full px-6 py-4 border-b border-slate-100 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-sm font-bold text-slate-800">Historial de ahorros automáticos</h3>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHistory && (
            <ul className="divide-y divide-slate-100">
              {recentLogs.map(log => {
                const statusInfo = STATUS_LABELS[log.status] ?? STATUS_LABELS.accepted;
                return (
                  <li key={log.id} className="px-6 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-sm">
                      {log.status === 'declined' ? '✗' : '🏦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{log.incomeName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{fmtDate(log.createdAt)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        {log.targetSavingName && (
                          <span className="text-xs text-slate-400 truncate">→ {log.targetSavingName}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-semibold font-mono tabular-nums ${
                        log.status === 'declined' ? 'text-slate-400 line-through' : 'text-emerald-700'
                      }`}>
                        {fmtAmount(log.savedAmount)}
                      </p>
                      <p className="text-xs text-slate-400">{log.percentage}%</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Modal crear/editar ──────────────────────────── */}
      <AutoSavingRuleModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRule(null); }}
        editingRule={editingRule}
      />

      {/* ── Confirm delete ─────────────────────────────── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Eliminar regla</h3>
            <p className="text-sm text-slate-500 mb-5">
              ¿Eliminar esta regla de ahorro? El historial se conservará.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 py-2 text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Sub-componente de fila de regla ────────────────────
interface RuleRowProps {
  rule: AutoSavingRule;
  categoryName: string;
  savingName: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  fmtDate: (d: string) => string;
  fmtAmount: (n: number) => string;
}

function RuleRow({ rule, categoryName, savingName, onEdit, onToggle, onDelete, fmtDate, fmtAmount }: RuleRowProps) {
  return (
    <li className="px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{categoryName}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {rule.percentage}%
            </span>
            <span className="text-xs text-slate-400">→</span>
            <span className="text-xs text-slate-600 font-medium truncate">{savingName}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              rule.askEveryTime
                ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
            }`}>
              {rule.askEveryTime ? 'Preguntar' : 'Automático'}
            </span>
            {rule.lastApplied && (
              <span className="text-xs text-slate-400">Último: {fmtDate(rule.lastApplied)}</span>
            )}
            {(rule.totalSaved ?? 0) > 0 && (
              <span className="text-xs text-emerald-600 font-mono font-medium">
                {fmtAmount(rule.totalSaved ?? 0)} ahorrados
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg transition-colors ${
              rule.isActive
                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
            title={rule.isActive ? 'Pausar' : 'Activar'}
          >
            {rule.isActive ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}
