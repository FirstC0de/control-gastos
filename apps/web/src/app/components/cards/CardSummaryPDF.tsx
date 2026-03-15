'use client';

import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import ExportModal from '../ExportModal';

export default function CardSummaryPDF() {
  const { cards, getInstallmentSummary, getMonthlyProjection, selectedMonth, setSelectedMonth } = useFinance();
  const [selectedCardId, setSelectedCardId] = useState<string | 'all'>('all');
  const [exportOpen, setExportOpen] = useState(false);

  const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  const prevMonth = () => {
    const { year, month } = selectedMonth;
    setSelectedMonth(month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  };
  const nextMonth = () => {
    const { year, month } = selectedMonth;
    setSelectedMonth(month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  };
  const monthLabel = new Date(selectedMonth.year, selectedMonth.month, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const summary = getInstallmentSummary(selectedMonth.year, selectedMonth.month, selectedCardId);
  // 8 meses: 1 anterior + mes seleccionado + 6 futuros (getMonthlyProjection ya arranca en -1)
  const projection = getMonthlyProjection(8, selectedCardId);

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
          {/* Navegador de mes — sincronizado con el dashboard */}
          <div className="flex items-center gap-2 mt-1">
            <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1 transition-colors">‹</button>
            <span className="text-xs font-medium text-slate-600 capitalize min-w-28 text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600 text-lg leading-none px-1 transition-colors">›</button>
          </div>
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
          Proyección mensual
        </h3>
        <div className="space-y-2">
          {projection.map((p, i) => {
            const maxTotal = Math.max(...projection.map(x => x.total), 1);
            // i=0 → mes anterior, i=1 → mes seleccionado, i>=2 → futuros
            const isSelected = i === 1;
            const isPrev     = i === 0;
            return (
              <div key={p.label} className={`flex items-center gap-3 ${isSelected ? 'bg-indigo-50 rounded-xl px-2 py-1 -mx-2' : ''}`}>
                <span className={`text-xs w-20 shrink-0 capitalize ${
                  isSelected ? 'font-bold text-indigo-700' :
                  isPrev     ? 'text-slate-400 italic' :
                               'text-slate-500'
                }`}>
                  {p.label}
                  {isSelected && <span className="ml-1 text-[10px] bg-indigo-200 text-indigo-700 rounded-full px-1">actual</span>}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden flex">
                  <div className={`h-full transition-all ${isPrev ? 'bg-emerald-300' : 'bg-emerald-400'}`}
                    style={{ width: `${(p.cash / maxTotal) * 100}%` }} />
                  <div className={`h-full transition-all ${isPrev ? 'bg-amber-300' : 'bg-amber-400'}`}
                    style={{ width: `${(p.installments / maxTotal) * 100}%` }} />
                </div>
                <span className={`text-xs font-semibold w-20 text-right shrink-0 ${
                  isSelected ? 'text-indigo-700 font-bold' :
                  isPrev     ? 'text-slate-400' :
                               'text-slate-700'
                }`}>
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