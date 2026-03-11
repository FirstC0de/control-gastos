'use client';

import { useFinance } from '../../context/FinanceContext';

export default function MonthNavigator() {
  const { selectedMonth, setSelectedMonth } = useFinance();
  const { year, month } = selectedMonth;

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

  const isCurrentMonth = (() => {
    const n = new Date();
    return year === n.getFullYear() && month === n.getMonth();
  })();

  return (
    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
      <button
        onClick={prev}
        className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-all text-sm font-medium"
      >
        ‹
      </button>
      <span className="px-3 py-1 text-sm font-semibold text-slate-800 capitalize min-w-36 text-center">
        {label}
      </span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 rounded-lg transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}
