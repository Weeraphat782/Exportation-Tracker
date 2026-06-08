"use client";

import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Always renders as DD/MM/YYYY regardless of browser locale */
export function formatDDMMYYYY(value: string): string {
  const d = parseISO(value);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface DatePickerFieldProps {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Override the trigger button className */
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export function DatePickerField({
  value,
  onChange,
  disabled,
  placeholder = 'Set date',
  className,
  align = 'start',
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const [view, setView] = useState<Date>(() => selected ?? new Date());

  React.useEffect(() => {
    if (open) setView(parseISO(value) ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const grid = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7; // Monday-first
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  const todayIso = toISO(new Date());

  const pick = (d: Date) => {
    onChange(toISO(d));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={
            className ??
            (value
              ? 'rounded bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200'
              : 'inline-flex items-center gap-1 rounded border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600')
          }
        >
          {value ? (
            formatDDMMYYYY(value)
          ) : (
            <>
              <Plus className="h-3 w-3" /> {placeholder}
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align={align}>
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            className="p-1 rounded hover:bg-slate-100"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            className="p-1 rounded hover:bg-slate-100"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-[10px] font-semibold text-gray-400 text-center w-8 h-6 flex items-center justify-center"
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((d, i) => {
            if (!d) return <div key={i} className="w-8 h-8" />;
            const iso = toISO(d);
            const isSelected = iso === value;
            const isToday = iso === todayIso;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(d)}
                className={`w-8 h-8 rounded text-xs flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold'
                    : isToday
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'hover:bg-slate-100 text-gray-700'
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <button
            type="button"
            onClick={() => pick(new Date())}
            className="text-xs text-blue-600 hover:underline"
          >
            Today
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-xs text-red-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
