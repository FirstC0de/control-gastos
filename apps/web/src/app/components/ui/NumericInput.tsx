'use client';

import { useState } from 'react';

export type NumericVariant = 'currency' | 'percentage' | 'decimal' | 'integer';

export interface NumericInputProps {
  value: number | string;
  onChange: (value: number) => void;
  variant?: NumericVariant;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  /** Show +/- step buttons (útil para porcentajes) */
  stepper?: boolean;
  stepAmount?: number;
}

const formatCurrency = (num: number): string =>
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);

export default function NumericInput({
  value,
  onChange,
  variant = 'currency',
  min,
  max,
  placeholder = '0',
  className = '',
  disabled,
  required,
  autoFocus,
  id,
  name,
  stepper = false,
  stepAmount = 1,
}: NumericInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');

  const numValue =
    typeof value === 'string'
      ? parseFloat(value.replace(',', '.')) || 0
      : value ?? 0;

  const displayValue = focused
    ? raw
    : numValue === 0
    ? ''
    : variant === 'currency'
    ? formatCurrency(numValue)
    : String(numValue);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setRaw(numValue === 0 ? '' : String(numValue));
    setFocused(true);
    requestAnimationFrame(() => e.target.select());
  };

  const handleBlur = () => setFocused(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    if (variant === 'integer') {
      input = input.replace(/\D/g, '');
    } else {
      input = input.replace(/[^\d.,]/g, '');
      // Solo un separador decimal
      const parts = input.split(/[.,]/);
      if (parts.length > 2) input = parts[0] + ',' + parts.slice(1).join('');
    }

    setRaw(input);

    if (input === '' || input === ',' || input === '.') {
      onChange(0);
      return;
    }

    const parsed = parseFloat(input.replace(',', '.'));
    if (!isNaN(parsed)) onChange(clamp(parsed));
  };

  const step = (delta: number) => {
    onChange(clamp(numValue + delta));
  };

  const inputMode = variant === 'integer' || variant === 'percentage' ? 'numeric' : 'decimal';

  const inputEl = (
    <input
      id={id}
      name={name}
      type="text"
      inputMode={inputMode}
      pattern={variant === 'integer' || variant === 'percentage' ? '[0-9]*' : '[0-9]*[.,]?[0-9]*'}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      style={{ fontSize: '16px' }}
      className={`
        w-full px-3 border bg-white font-mono
        placeholder:text-slate-400 placeholder:font-sans
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400
        transition-shadow disabled:opacity-50 disabled:cursor-not-allowed
        min-h-[44px]
        ${stepper ? 'rounded-none text-center' : 'rounded-xl py-2.5'}
        ${className}
      `}
    />
  );

  if (stepper) {
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => step(-stepAmount)}
          disabled={disabled || (min !== undefined && numValue <= min)}
          className="min-h-[44px] px-3 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-l-xl transition-colors disabled:opacity-40 font-medium"
        >
          −
        </button>
        {inputEl}
        <button
          type="button"
          onClick={() => step(stepAmount)}
          disabled={disabled || (max !== undefined && numValue >= max)}
          className="min-h-[44px] px-3 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-r-xl transition-colors disabled:opacity-40 font-medium"
        >
          +
        </button>
      </div>
    );
  }

  return inputEl;
}
