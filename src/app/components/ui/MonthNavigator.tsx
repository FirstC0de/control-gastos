'use client';

import { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function MonthNavigator() {
  const { selectedMonth, setSelectedMonth } = useFinance();
  const { year, month } = selectedMonth;

  const [open, setOpen]         = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  // Permitir navegar hasta 24 meses en el futuro
  const maxYear  = currentYear + 2;
  const maxMonth = currentMonth; // mismo mes del año +2

  // Sync picker year when selectedMonth changes externally
  useEffect(() => { setPickerYear(year); }, [year]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const label = new Date(year, month, 1).toLocaleDateString('es-AR', {
    month: 'long', year: 'numeric',
  });

  const prev = () => {
    if (month === 0) setSelectedMonth({ year: year - 1, month: 11 });
    else setSelectedMonth({ year, month: month - 1 });
  };

  const next = () => {
    if (month === 11) setSelectedMonth({ year: year + 1, month: 0 });
    else setSelectedMonth({ year, month: month + 1 });
  };

  const isCurrentMonth = year === currentYear && month === currentMonth;

  const isAboveMax = (y: number, m: number) =>
    y > maxYear || (y === maxYear && m > maxMonth);

  const selectMonth = (m: number) => {
    if (isAboveMax(pickerYear, m)) return;
    setSelectedMonth({ year: pickerYear, month: m });
    setOpen(false);
  };

  const isFuture = (y: number, m: number) =>
    y > currentYear || (y === currentYear && m > currentMonth);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 bg-slate-100 rounded-xl p-1">

      {/* Prev */}
      <button
        onClick={prev}
        className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-all text-sm font-medium"
      >
        ‹
      </button>

      {/* Label — abre el picker */}
      <button
        onClick={() => { setPickerYear(year); setOpen(o => !o); }}
        className={`px-3 py-1 text-sm font-semibold rounded-lg capitalize min-w-36 text-center transition-all ${
          open
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-800 hover:bg-white hover:shadow-sm'
        }`}
      >
        {label}
      </button>

      {/* Next */}
      <button
        onClick={next}
        disabled={isAboveMax(year, month)}
        className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>

      {/* ── Picker dropdown ──────────────────────────────── */}
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in">

          {/* Año */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <button
              onClick={() => setPickerYear(y => y - 1)}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              ‹
            </button>
            <span className="text-sm font-bold text-slate-800">{pickerYear}</span>
            <button
              onClick={() => setPickerYear(y => y + 1)}
              disabled={pickerYear >= maxYear}
              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors font-medium disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>

          {/* Grilla de meses */}
          <div className="grid grid-cols-4 gap-1 p-3">
            {MONTHS.map((name, m) => {
              const isSelected = pickerYear === year && m === month;
              const isToday    = pickerYear === currentYear && m === currentMonth;
              const disabled   = isAboveMax(pickerYear, m);

              return (
                <button
                  key={m}
                  onClick={() => selectMonth(m)}
                  disabled={disabled}
                  className={`py-2 text-xs font-medium rounded-xl transition-all relative ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isToday
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300'
                      : disabled
                      ? 'text-slate-200 cursor-not-allowed'
                      : isFuture(pickerYear, m)
                      ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 italic'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {name}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Ir al mes actual */}
          {!isCurrentMonth && (
            <div className="px-3 pb-3">
              <button
                onClick={() => {
                  setSelectedMonth({ year: currentYear, month: currentMonth });
                  setOpen(false);
                }}
                className="w-full py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-100"
              >
                Ir al mes actual
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
