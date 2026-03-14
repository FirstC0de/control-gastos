'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { FixedTerm } from '@controlados/shared';
import FixedTermModal from './FixedTermModal';

const fmt    = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function DaysChip({ daysRemaining, isExpired }: { daysRemaining: number; isExpired: boolean }) {
  if (isExpired) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
      Vencido
    </span>
  );
  if (daysRemaining <= 7) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
      {daysRemaining === 0 ? 'Vence hoy' : `${daysRemaining}d`}
    </span>
  );
  if (daysRemaining <= 30) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      {daysRemaining}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
      {daysRemaining}d
    </span>
  );
}

export default function FixedTermList() {
  const { getFixedTermStatus, deleteFixedTerm } = useFinance();

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTerm,    setEditTerm]    = useState<FixedTerm | undefined>();
  const [confirmDel,  setConfirmDel]  = useState<string | null>(null);

  const statuses = getFixedTermStatus().sort((a, b) => {
    // Ordenar por fecha de vencimiento ascendente
    return new Date(a.fixedTerm.endDate).getTime() - new Date(b.fixedTerm.endDate).getTime();
  });

  const totalARS = statuses
    .filter(s => s.fixedTerm.currency === 'ARS')
    .reduce((sum, s) => sum + s.currentValue, 0);
  const totalInterestARS = statuses
    .filter(s => s.fixedTerm.currency === 'ARS')
    .reduce((sum, s) => sum + s.projectedInterest, 0);
  const expiringSoon = statuses.filter(s => s.isExpiringSoon || s.isExpired).length;

  return (
    <div className="space-y-4">
      {/* Alerta de vencimientos */}
      {expiringSoon > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xs font-semibold text-amber-800">
            {expiringSoon} plazo{expiringSoon !== 1 ? 's' : ''} venciendo pronto o vencido{expiringSoon !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Header + Agregar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{statuses.length} plazo{statuses.length !== 1 ? 's' : ''} fijo{statuses.length !== 1 ? 's' : ''}</p>
          {totalARS > 0 && (
            <p className="text-xs text-slate-400">
              ${fmt(totalARS)} ARS · Interés proyectado: <span className="text-emerald-600 font-medium">+${fmt(totalInterestARS)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => { setEditTerm(undefined); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </div>

      {statuses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-10 text-center">
          <p className="text-sm font-semibold text-slate-700 mb-1">Sin plazos fijos</p>
          <p className="text-xs text-slate-400">Registrá tus plazos fijos para ver los intereses devengados y fechas de vencimiento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {statuses.map(({ fixedTerm: ft, daysRemaining, daysTotal, accruedInterest, projectedInterest, currentValue, isExpired, daysElapsed }) => (
            <div
              key={ft.id}
              className={`bg-white rounded-2xl border p-5 ${isExpired ? 'border-slate-200 opacity-75' : 'border-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900">{ft.institution}</p>
                    <DaysChip daysRemaining={daysRemaining} isExpired={isExpired} />
                    {ft.renewOnExpiry && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                        Renueva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(ft.startDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' → '}
                    {new Date(ft.endDate + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}{daysTotal} días · TNA {ft.rate}%
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditTerm(ft); setModalOpen(true); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => setConfirmDel(ft.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Números */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Capital</p>
                  <p className="text-sm font-bold font-mono text-slate-900">
                    {ft.currency === 'USD' ? 'U$D ' : '$'}{fmtDec(ft.principal)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Devengado</p>
                  <p className="text-sm font-bold font-mono text-emerald-600">+${fmtDec(accruedInterest)}</p>
                  <p className="text-[10px] text-slate-400">{daysElapsed}d / {daysTotal}d</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Al vencimiento</p>
                  <p className="text-sm font-bold font-mono text-blue-700">${fmtDec(ft.principal + projectedInterest)}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">+${fmtDec(projectedInterest)}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isExpired ? 'bg-slate-300' : daysRemaining <= 7 ? 'bg-rose-400' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, daysTotal > 0 ? (daysElapsed / daysTotal) * 100 : 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <FixedTermModal
          onClose={() => { setModalOpen(false); setEditTerm(undefined); }}
          fixedTerm={editTerm}
        />
      )}

      {confirmDel && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setConfirmDel(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto">
              <p className="text-sm font-bold text-slate-900 mb-2">¿Eliminar este plazo fijo?</p>
              <p className="text-xs text-slate-500 mb-5">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={async () => { await deleteFixedTerm(confirmDel); setConfirmDel(null); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors">Eliminar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
