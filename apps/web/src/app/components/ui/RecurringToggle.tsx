'use client';

interface RecurringToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
  descOn: string;
  descOff: string;
  activeWhenTrue?: boolean;
}

export default function RecurringToggle({ value, onChange, labelOn, labelOff, activeWhenTrue }: RecurringToggleProps) {
  const active = activeWhenTrue ? value : !value;
  const label  = activeWhenTrue ? labelOn : labelOff;

  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
        active
          ? 'bg-violet-600 border-violet-600 text-white'
          : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600'
      }`}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-white' : 'bg-slate-300'}`} />
      {label}
    </button>
  );
}
