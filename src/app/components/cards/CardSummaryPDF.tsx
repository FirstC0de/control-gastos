'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import ExportModal from '../ExportModal';

export default function CardSummaryPDF() {
  const { cards, getInstallmentSummary, getMonthlyProjection } = useFinance();
  const [selectedCardId, setSelectedCardId] = useState<string | 'all'>('all');
  const [exportOpen, setExportOpen] = useState(false);

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const now = new Date();
  const summary = getInstallmentSummary(now.getFullYear(), now.getMonth(), selectedCardId);
  const projection = getMonthlyProjection(6, selectedCardId);

  const cashItems = summary.cashItems;
  const installmentItems = summary.installmentItems;
  const totalCash = cashItems.reduce((s, e) => s + e.amount, 0);
  const totalInstallments = installmentItems.reduce((s, e) => s + (e.installmentAmount ?? 0), 0);
  const totalMonth = totalCash + totalInstallments;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Resumen mensual</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </button>
      </div>

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}

      {/* Selector de tarjeta */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Filtrar por tarjeta
        </label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedCardId('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${selectedCardId === 'all'
              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}>
            Todas
          </button>
          {cards.map(card => (
            <button key={card.id} onClick={() => setSelectedCardId(card.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${selectedCardId === card.id
                ? 'text-white'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              style={selectedCardId === card.id ? { backgroundColor: card.color, borderColor: card.color } : {}}>
              {card.name}
            </button>
          ))}
        </div>
      </div>


      {/* Cards de resumen - Con ancho automático */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Contado', value: totalCash, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Cuotas', value: totalInstallments, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total del mes', value: totalMonth, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-3 sm:p-4 transition-all hover:shadow-md flex-1 min-w-35 sm:min-w-45`}>
            <p className="text-xs font-medium text-slate-500 mb-1 whitespace-nowrap">{label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${color} break-all`}>
              ${new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}
            </p>
            {/* Tooltip con valor exacto (opcional) */}
            <p className="text-[10px] text-slate-400 mt-1 opacity-0 hover:opacity-100 transition-opacity">
              {value.toLocaleString('es-AR')} ARS
            </p>
          </div>
        ))}
      </div>

      {/* Proyección visual */}
      <div>
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Próximos 6 meses
        </h3>
        <div className="space-y-2">
          {projection.map((p, i) => {
            const maxTotal = Math.max(...projection.map(x => x.total), 1);
            return (
              <div key={p.label} className="flex items-center gap-3">
                <span className={`text-xs w-20 shrink-0 ${i === 0 ? 'font-semibold text-indigo-600' : 'text-slate-500'}`}>
                  {p.label}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden flex">
                  <div className="bg-emerald-400 h-full transition-all"
                    style={{ width: `${(p.cash / maxTotal) * 100}%` }} />
                  <div className="bg-amber-400 h-full transition-all"
                    style={{ width: `${(p.installments / maxTotal) * 100}%` }} />
                </div>
                <span className={`text-xs font-semibold w-20 text-right shrink-0 ${i === 0 ? 'text-indigo-600' : 'text-slate-700'}`}>
                  ${fmt(p.total)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-slate-500">Contado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-500">Cuotas</span>
          </div>
        </div>
      </div>
    </div>
  );
}