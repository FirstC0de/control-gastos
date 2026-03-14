'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useExchangeRate } from '../context/ExchangeRateContext';
import { exportCSV, buildExportRows, generateFullPDF, generateCardPDF, type PDFSections } from '../lib/exportUtils';
import type { Expense, Income } from '../lib/types';
import { toast } from 'sonner';

type Format  = 'csv' | 'pdf' | 'pdf_card';
type Period  = 'current' | 'custom';

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                     'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function filterByMonth(
  expenses: Expense[],
  incomes: Income[],
  year: number,
  month: number,
): { expenses: Expense[]; incomes: Income[] } {
  const key = `${year}-${String(month + 1).padStart(2, '0')}`;
  return {
    expenses: expenses.filter(e => (e.monthYear ?? e.date.substring(0, 7)) === key),
    incomes:  incomes.filter(i => i.date.substring(0, 7) === key),
  };
}

export default function ExportModal({ onClose }: { onClose: () => void }) {
  const {
    expenses, incomes, categories, cards,
    monthlyExpenses, monthlyIncomes, selectedMonth,
    getInstallmentSummary, getMonthlyProjection,
  } = useFinance();
  const { blue } = useExchangeRate();

  const [format, setFormat]     = useState<Format>('csv');
  const [period, setPeriod]     = useState<Period>('current');
  const [customYear,  setCustomYear]  = useState(selectedMonth.year);
  const [customMonth, setCustomMonth] = useState(selectedMonth.month);

  const [inclExpenses, setInclExpenses] = useState(true);
  const [inclIncomes,  setInclIncomes]  = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | 'all'>('all');

  const [sections, setSections] = useState<PDFSections>({
    summary:    true,
    categories: true,
    expenses:   true,
    incomes:    true,
  });

  const [generating, setGenerating] = useState(false);

  // Datos según período seleccionado
  const { filteredExpenses, filteredIncomes, periodLabel } = useMemo(() => {
    if (period === 'current') {
      const label = new Date(selectedMonth.year, selectedMonth.month, 1)
        .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      return {
        filteredExpenses: monthlyExpenses,
        filteredIncomes:  monthlyIncomes,
        periodLabel: label.charAt(0).toUpperCase() + label.slice(1),
      };
    }
    const { expenses: fe, incomes: fi } = filterByMonth(expenses, incomes, customYear, customMonth);
    const label = new Date(customYear, customMonth, 1)
      .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return {
      filteredExpenses: fe,
      filteredIncomes:  fi,
      periodLabel: label.charAt(0).toUpperCase() + label.slice(1),
    };
  }, [period, selectedMonth, monthlyExpenses, monthlyIncomes, expenses, incomes, customYear, customMonth]);

  const expenseCount = inclExpenses ? filteredExpenses.length : 0;
  const incomeCount  = inclIncomes  ? filteredIncomes.length  : 0;
  const totalRecords = expenseCount + incomeCount;

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleExport = async () => {
    if (format !== 'pdf_card' && totalRecords === 0 && format === 'csv') {
      toast.error('No hay datos para exportar en el período seleccionado');
      return;
    }
    setGenerating(true);
    try {
      const slug = periodLabel.replace(/\s+/g, '-').toLowerCase();
      const now = new Date();

      if (format === 'csv') {
        const rows = buildExportRows({
          expenses: filteredExpenses,
          incomes:  filteredIncomes,
          categories, cards,
          includeExpenses: inclExpenses,
          includeIncomes:  inclIncomes,
        });
        exportCSV(rows, `controlados-${slug}.csv`);
        toast.success(`CSV exportado — ${rows.length} registros`);
        onClose();
      } else if (format === 'pdf') {
        await generateFullPDF({
          expenses: inclExpenses ? filteredExpenses : [],
          incomes:  inclIncomes  ? filteredIncomes  : [],
          categories, cards, sections,
          periodLabel,
          blue: blue ?? undefined,
        });
        toast.success('PDF generado correctamente');
        onClose();
      } else {
        const summary = getInstallmentSummary(now.getFullYear(), now.getMonth(), selectedCardId);
        const projection = getMonthlyProjection(6, selectedCardId);
        await generateCardPDF({ cards, selectedCardId, summary, projection });
        toast.success('PDF de tarjeta generado');
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al exportar. Intentá de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const now = new Date();
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900">Exportar datos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Elegí el formato y el período</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">

            {/* Formato */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Formato</p>
              <div className="flex gap-2">
                {([
                  { key: 'csv',      label: 'CSV',         icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                  { key: 'pdf',      label: 'PDF',         icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',             active: 'border-blue-500 bg-blue-50 text-blue-700' },
                  { key: 'pdf_card', label: 'PDF Tarjeta', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',                              active: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
                ] as { key: Format; label: string; icon: string; active: string }[]).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      format === f.key ? f.active : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {format === 'csv'      && 'Compatible con Excel y Google Sheets. Incluye BOM UTF-8.'}
                {format === 'pdf'      && 'Reporte completo con resumen, categorías y detalle de movimientos.'}
                {format === 'pdf_card' && 'Resumen de tarjetas: contado, cuotas y proyección a 6 meses.'}
              </p>
            </div>

            {/* Selector de tarjeta — solo para PDF Tarjeta */}
            {format === 'pdf_card' && (
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tarjeta</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCardId('all')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      selectedCardId === 'all'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Todas
                  </button>
                  {cards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        selectedCardId === card.id ? 'text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      style={selectedCardId === card.id ? { backgroundColor: card.color, borderColor: card.color } : {}}
                    >
                      {card.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Período y contenido — no aplican para PDF Tarjeta */}
            {format !== 'pdf_card' && (
              <>
                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Período</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="period"
                        checked={period === 'current'}
                        onChange={() => setPeriod('current')}
                        className="accent-blue-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">Mes visualizado</p>
                        <p className="text-xs text-slate-400">{periodLabel}</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="radio"
                        name="period"
                        checked={period === 'custom'}
                        onChange={() => setPeriod('custom')}
                        className="accent-blue-600 mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 mb-2">Otro mes</p>
                        {period === 'custom' && (
                          <div className="flex gap-2">
                            <select
                              value={customMonth}
                              onChange={e => setCustomMonth(Number(e.target.value))}
                              className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {MONTH_NAMES.map((name, i) => (
                                <option key={i} value={i}>{name}</option>
                              ))}
                            </select>
                            <select
                              value={customYear}
                              onChange={e => setCustomYear(Number(e.target.value))}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Contenido</p>
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={inclExpenses}
                          onChange={e => setInclExpenses(e.target.checked)}
                          className="accent-rose-500 w-4 h-4"
                        />
                        <span className="text-sm text-slate-700 font-medium">Gastos</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {filteredExpenses.length} registros
                      </span>
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={inclIncomes}
                          onChange={e => setInclIncomes(e.target.checked)}
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm text-slate-700 font-medium">Ingresos</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {filteredIncomes.length} registros
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Secciones PDF */}
            {format === 'pdf' && (
              <div>
                <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Secciones del PDF</p>
                <div className="space-y-1.5">
                  {([
                    { key: 'summary',    label: 'Resumen ejecutivo' },
                    { key: 'categories', label: 'Gastos por categoría' },
                    { key: 'expenses',   label: 'Detalle de gastos' },
                    { key: 'incomes',    label: 'Detalle de ingresos' },
                  ] as { key: keyof PDFSections; label: string }[]).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={sections[key]}
                        onChange={e => setSections(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="accent-blue-600 w-4 h-4"
                      />
                      <span className="text-sm text-slate-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="rounded-xl px-4 py-3 border bg-blue-50 border-blue-100 text-blue-800">
              {format === 'pdf_card' ? (
                <>
                  <p className="text-sm font-semibold">PDF de tarjeta — mes actual</p>
                  <p className="text-xs mt-0.5 opacity-70">
                    Contado, cuotas del mes y proyección a 6 meses ·{' '}
                    {selectedCardId === 'all' ? 'Todas las tarjetas' : cards.find(c => c.id === selectedCardId)?.name}
                  </p>
                </>
              ) : totalRecords > 0 ? (
                <>
                  <p className="text-sm font-semibold">
                    {totalRecords} registro{totalRecords !== 1 ? 's' : ''} a exportar
                  </p>
                  <p className="text-xs mt-0.5 opacity-70">
                    {expenseCount > 0 && `${expenseCount} gasto${expenseCount !== 1 ? 's' : ''}`}
                    {expenseCount > 0 && incomeCount > 0 && ' · '}
                    {incomeCount  > 0 && `${incomeCount} ingreso${incomeCount !== 1 ? 's' : ''}`}
                    {' · '}{periodLabel}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-slate-500">Sin datos en el período seleccionado</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={generating || (format === 'csv' && totalRecords === 0)}
              className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                format === 'csv'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Exportar {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
