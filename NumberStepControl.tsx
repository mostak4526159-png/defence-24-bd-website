import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepControlProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helpText?: string;
}

export const NumberStepControl: React.FC<NumberStepControlProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
  step = 1,
  unit = 'px',
  helpText,
}) => {
  const handleDecrement = () => {
    const nextVal = Math.max(min, Number((value - step).toFixed(2)));
    onChange(nextVal);
  };

  const handleIncrement = () => {
    const nextVal = Math.min(max, Number((value + step).toFixed(2)));
    onChange(nextVal);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <label className="font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {unit && (
          <span className="text-[11px] text-slate-400 font-mono">
            {value} {unit}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleInputChange}
          className="flex-1 min-w-[60px] text-center font-mono text-xs sm:text-sm py-1.5 px-2 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {helpText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {helpText}
        </p>
      )}
    </div>
  );
};
