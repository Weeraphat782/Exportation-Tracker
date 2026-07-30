'use client';

import type { TemplateId } from './brand';
import { TEMPLATE_META } from './brand';

const ORDER: TemplateId[] = ['T0', 'T1', 'T2', 'T2b', 'T2c', 'T3', 'T4'];

interface TemplatePickerProps {
  selected: TemplateId[];
  onChange: (ids: TemplateId[]) => void;
}

export function TemplatePicker({ selected, onChange }: TemplatePickerProps) {
  const select = (id: TemplateId) => onChange([id]);

  return (
    <div className="sa-template-grid">
      {ORDER.map((id) => {
        const m = TEMPLATE_META[id];
        const active = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            className={active ? 'sa-tpl active' : 'sa-tpl'}
            onClick={() => select(id)}
          >
            <span className="sa-tpl-check">{active ? '✓' : ''}</span>
            <div>
              <strong>{m.label}</strong>
              <span>{m.desc}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function templatesNeedPhoto(templates: TemplateId[]) {
  return templates.some((t) => TEMPLATE_META[t].needsPhoto);
}

export function templatesNeedPromo(templates: TemplateId[]) {
  return templates.some((t) => TEMPLATE_META[t].isPromo);
}
