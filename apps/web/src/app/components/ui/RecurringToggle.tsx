'use client';

interface RecurringToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  labelOn: string;
  labelOff: string;
  descOn: string;
  descOff: string;
}

const RepeatIcon = () => (
  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function RecurringToggle({ value, onChange, labelOn, labelOff, descOn, descOff }: RecurringToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm transition-all ${
        value
          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <RepeatIcon />
        <div className="text-left">
          <p className="text-sm font-semibold leading-tight">{value ? labelOn : labelOff}</p>
          <p className="text-xs text-slate-400 leading-tight mt-0.5">{value ? descOn : descOff}</p>
        </div>
      </div>
      <div className={`ml-4 w-10 h-5 rounded-full transition-colors relative shrink-0 ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </button>
  );
}
