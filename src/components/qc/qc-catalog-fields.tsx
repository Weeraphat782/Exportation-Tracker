'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  QC_CATALOG,
  type QcCatalogSelections,
} from '@/lib/qc-catalog';

interface QcCatalogFieldsProps {
  value: QcCatalogSelections;
  onChange?: (next: QcCatalogSelections) => void;
  readOnly?: boolean;
  /** Compact layout for print form */
  variant?: 'default' | 'print';
}

function PrintCheck({ checked, label }: { checked: boolean; label: React.ReactNode }) {
  return (
    <span className="inline-flex items-start gap-1.5 text-left align-top">
      <span
        className={`mt-[2px] inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center border bg-white text-[11px] font-bold leading-none [print-color-adjust:exact] [-webkit-print-color-adjust:exact] ${
          checked ? 'border-red-600 text-red-600' : 'border-slate-800 text-transparent'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="text-[13px] leading-tight">{label}</span>
    </span>
  );
}

export function QcCatalogFields({
  value,
  onChange,
  readOnly = false,
  variant = 'default',
}: QcCatalogFieldsProps) {
  const isPrint = variant === 'print';
  const editable = !readOnly && !!onChange;

  const toggleItem = (key: string, checked: boolean) => {
    if (!onChange) return;
    const items = checked
      ? [...new Set([...value.items, key])]
      : value.items.filter((k) => k !== key);
    onChange({ ...value, items });
  };

  const setUnit = (key: string, unit: string) => {
    if (!onChange) return;
    onChange({
      ...value,
      units: { ...(value.units || {}), [key]: unit },
    });
  };

  const setOtherField = (field: 'potencyOther' | 'heavyMetalsOther' | 'other', text: string) => {
    if (!onChange) return;
    onChange({ ...value, [field]: text });
  };

  const renderCheck = (checked: boolean, label: React.ReactNode, onToggle?: () => void) => {
    if (isPrint || readOnly) {
      return <PrintCheck checked={checked} label={label} />;
    }
    return (
      <label className="flex items-start gap-2 cursor-pointer">
        <Checkbox checked={checked} onCheckedChange={() => onToggle?.()} className="mt-0.5" />
        <span className="text-sm leading-tight">{label}</span>
      </label>
    );
  };

  return (
    <div className={isPrint ? 'space-y-2' : 'space-y-6'}>
      {QC_CATALOG.map((group) => {
        if (group.id === 'other') {
          const otherText = value.other || '';
          return (
            <div key={group.id} className={isPrint ? 'space-y-1' : 'space-y-2'}>
              <p className={isPrint ? 'text-[13px] font-semibold' : 'text-sm font-semibold text-slate-800'}>
                {group.label}
              </p>
              {editable ? (
                <Textarea
                  value={otherText}
                  onChange={(e) => setOtherField('other', e.target.value)}
                  rows={3}
                  placeholder="Specify other tests…"
                  className="text-sm"
                />
              ) : (
                <p className={`text-[13px] whitespace-pre-wrap border-b border-dotted border-slate-400 min-h-[1.5rem] ${!otherText.trim() ? 'text-slate-400' : ''}`}>
                  {otherText.trim() || (isPrint ? '_____________________________________________________________________________________' : '—')}
                </p>
              )}
            </div>
          );
        }

        return (
          <div key={group.id} className={isPrint ? 'space-y-1' : 'space-y-2'}>
            <p className={isPrint ? 'text-[13px] font-semibold' : 'text-sm font-semibold text-slate-800'}>
              {group.label}
              {group.id === 'microbiology' && isPrint ? ': (กรุณาระบุหน่วย)' : ''}
              {group.id === 'microbiology' && !isPrint ? (
                <span className="font-normal text-slate-500 text-xs ml-1">(specify unit)</span>
              ) : null}
            </p>

            <div
              className={
                isPrint
                  ? group.id === 'potency'
                    ? 'grid grid-cols-2 gap-x-4 gap-y-1'
                    : group.id === 'heavy_metals'
                      ? 'flex flex-wrap gap-x-4 gap-y-1'
                      : 'space-y-1'
                  : 'space-y-2 pl-1'
              }
            >
              {group.items.map((item) => {
                const checked = value.items.includes(item.key);
                const unit = value.units?.[item.key] || '';

                if (group.requiresUnit) {
                  return (
                    <div
                      key={item.key}
                      className={isPrint ? 'flex flex-wrap items-baseline gap-1' : 'flex flex-wrap items-center gap-2'}
                    >
                      {renderCheck(checked, item.label, () => toggleItem(item.key, !checked))}
                      {editable ? (
                        checked && (
                          <Input
                            value={unit}
                            onChange={(e) => setUnit(item.key, e.target.value)}
                            placeholder="unit"
                            className={isPrint ? 'h-6 w-24 text-xs inline' : 'h-8 w-28 text-sm'}
                          />
                        )
                      ) : (
                        <span className="text-[13px] border-b border-dotted border-slate-400 px-1">
                          ({unit || '…'})
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={item.key}>
                    {renderCheck(checked, item.label, () => toggleItem(item.key, !checked))}
                  </div>
                );
              })}
            </div>

            {group.hasOtherField && group.otherFieldKey && (
              <div className={isPrint ? 'flex flex-wrap items-baseline gap-1 mt-1' : 'mt-2 space-y-1'}>
                <span className="text-[13px] shrink-0">Other</span>
                {editable ? (
                  <Input
                    value={value[group.otherFieldKey] || ''}
                    onChange={(e) => setOtherField(group.otherFieldKey!, e.target.value)}
                    className={isPrint ? 'flex-1 h-7 text-xs' : 'text-sm'}
                    placeholder="Specify…"
                  />
                ) : (
                  <span className="text-[13px] border-b border-dotted border-slate-400 flex-1 min-w-[120px] px-1">
                    {value[group.otherFieldKey]?.trim() || '\u00A0'}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!readOnly && (
        <p className="text-xs text-slate-500">
          Select all tests required for your sample. Microbiology items need a unit when selected.
        </p>
      )}
    </div>
  );
}
