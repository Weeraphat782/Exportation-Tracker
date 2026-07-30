'use client';

import type { ArtworkContent, FareRoute, TemplateId, TextStyleKey } from './brand';
import { COLORS, TEXT_STYLE_DEFAULTS } from './brand';
import { templatesNeedPhoto, templatesNeedPromo } from './TemplatePicker';

const SWATCHES = Object.entries(COLORS).map(([key, value]) => ({
  key,
  value,
  label: key
    .replace(/([a-z])([0-9]+)/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase()),
}));

interface ContentFormProps {
  templates: TemplateId[];
  content: ArtworkContent;
  onChange: (patch: Partial<ArtworkContent>) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="sa-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StyleControls({
  styleKey,
  content,
  onChange,
}: {
  styleKey: TextStyleKey;
  content: ArtworkContent;
  onChange: (patch: Partial<ArtworkContent>) => void;
}) {
  const def = TEXT_STYLE_DEFAULTS[styleKey];
  const cur = content.textStyles?.[styleKey] ?? {};

  const patchStyle = (field: 'size' | 'color', raw: string) => {
    const styles = { ...content.textStyles };
    const merged = { ...cur };
    if (field === 'size') {
      const n = raw === '' ? undefined : Number(raw);
      if (n === undefined || Number.isNaN(n)) delete merged.size;
      else merged.size = n;
    } else {
      if (raw === '') delete merged.color;
      else merged.color = raw;
    }
    if (merged.size === def.size) delete merged.size;
    if (merged.color === def.color) delete merged.color;
    if (Object.keys(merged).length === 0) delete styles[styleKey];
    else styles[styleKey] = merged;
    onChange({ textStyles: styles });
  };

  const isAuto = cur.color === undefined;

  return (
    <div className="sa-style-row">
      <label className="sa-style-size">
        <span>Size (px)</span>
        <input
          type="number"
          placeholder={String(def.size)}
          value={cur.size ?? ''}
          onChange={(e) => patchStyle('size', e.target.value)}
        />
      </label>
      <div className="sa-style-color">
        <span>Color</span>
        <div className="sa-swatch-tray" role="group" aria-label={`${def.label} color`}>
          <button
            type="button"
            className={`sa-swatch sa-swatch-auto${isAuto ? ' active' : ''}`}
            title="Auto (template default)"
            aria-label="Auto — use template default color"
            aria-pressed={isAuto}
            onClick={() => patchStyle('color', '')}
          />
          {SWATCHES.map(({ key, value, label }) => (
            <button
              key={key}
              type="button"
              className={`sa-swatch${!isAuto && cur.color === value ? ' active' : ''}`}
              style={{ backgroundColor: value }}
              title={label}
              aria-label={label}
              aria-pressed={!isAuto && cur.color === value}
              onClick={() => patchStyle('color', value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldWithStyle({
  label,
  styleKey,
  content,
  onChange,
  children,
}: {
  label: string;
  styleKey: TextStyleKey;
  content: ArtworkContent;
  onChange: (patch: Partial<ArtworkContent>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="sa-field-group">
      <Field label={label}>{children}</Field>
      <StyleControls styleKey={styleKey} content={content} onChange={onChange} />
    </div>
  );
}

export function ContentForm({ templates, content, onChange }: ContentFormProps) {
  const hasT3 = templates.includes('T3');
  const hasT4 = templates.includes('T4');
  const hasT0 = templates.includes('T0');
  const hasT1 = templates.includes('T1');
  const hasT2b = templates.includes('T2b');
  const showHeadline = templates.some((t) => t !== 'T0' && t !== 'T4');
  const showPromo = templatesNeedPromo(templates);

  return (
    <div className="sa-form">
      <Field label="Logo version">
        <div className="sa-seg-toggle">
          <button
            type="button"
            className={content.lockupTextColor === 'dark' ? 'active' : ''}
            onClick={() => onChange({ lockupTextColor: 'dark' })}
          >
            Dark (on light)
          </button>
          <button
            type="button"
            className={content.lockupTextColor === 'light' ? 'active' : ''}
            onClick={() => onChange({ lockupTextColor: 'light' })}
          >
            Light (on navy)
          </button>
        </div>
      </Field>

      <Field label="Logo position">
        <div className="sa-seg-toggle sa-seg-toggle-3">
          <button
            type="button"
            className={content.lockupPosition === 'top-left' ? 'active' : ''}
            onClick={() => onChange({ lockupPosition: 'top-left' })}
          >
            Top left
          </button>
          <button
            type="button"
            className={content.lockupPosition === 'top-right' ? 'active' : ''}
            onClick={() => onChange({ lockupPosition: 'top-right' })}
          >
            Top right
          </button>
          <button
            type="button"
            className={content.lockupPosition === 'bottom-left' ? 'active' : ''}
            onClick={() => onChange({ lockupPosition: 'bottom-left' })}
          >
            Bottom left
          </button>
        </div>
      </Field>

      {(hasT3 || hasT1) && (
        <FieldWithStyle label="Kicker / tag (max 1 line)" styleKey="eyebrow" content={content} onChange={onChange}>
          <input
            value={content.eyebrow}
            maxLength={28}
            onChange={(e) => onChange({ eyebrow: e.target.value })}
          />
        </FieldWithStyle>
      )}

      {showHeadline && (
        <FieldWithStyle label="Headline (max 2 lines)" styleKey="headline" content={content} onChange={onChange}>
          <textarea
            rows={2}
            value={content.headline}
            onChange={(e) => onChange({ headline: e.target.value.slice(0, 80) })}
          />
        </FieldWithStyle>
      )}

      {hasT1 && (
        <FieldWithStyle label="Support line (max 1 line)" styleKey="subhead" content={content} onChange={onChange}>
          <input
            value={content.subhead}
            maxLength={60}
            onChange={(e) => onChange({ subhead: e.target.value })}
          />
        </FieldWithStyle>
      )}

      {hasT3 && (
        <FieldWithStyle label="Body (max 3 lines)" styleKey="body" content={content} onChange={onChange}>
          <textarea
            rows={3}
            value={content.body}
            onChange={(e) => onChange({ body: e.target.value.slice(0, 160) })}
          />
        </FieldWithStyle>
      )}

      {showPromo && (
        <>
          {!hasT2b && (
            <>
              <FieldWithStyle label="Route from" styleKey="route" content={content} onChange={onChange}>
                <input value={content.routeFrom} onChange={(e) => onChange({ routeFrom: e.target.value })} />
              </FieldWithStyle>
              <Field label="Route to">
                <input value={content.routeTo} onChange={(e) => onChange({ routeTo: e.target.value })} />
              </Field>
              <FieldWithStyle label="Offer detail" styleKey="tripType" content={content} onChange={onChange}>
                <input value={content.tripType} onChange={(e) => onChange({ tripType: e.target.value })} />
              </FieldWithStyle>
            </>
          )}
          <FieldWithStyle label="Highlight value (e.g. 48h or 1,850)" styleKey="price" content={content} onChange={onChange}>
            <input
              value={content.price}
              onChange={(e) => onChange({ price: e.target.value.replace(/[^\d,%h]/gi, '') })}
            />
          </FieldWithStyle>
          {hasT2b && (
            <FieldWithStyle label="Pill text (optional override)" styleKey="pill" content={content} onChange={onChange}>
              <input value={content.pillText} onChange={(e) => onChange({ pillText: e.target.value })} />
            </FieldWithStyle>
          )}
        </>
      )}

      {hasT4 && (
        <>
          <FieldWithStyle label="Header title" styleKey="fareHeader" content={content} onChange={onChange}>
            <input value={content.fareHeader} onChange={(e) => onChange({ fareHeader: e.target.value })} />
          </FieldWithStyle>
          <FieldWithStyle label="Header subtitle" styleKey="fareSubheader" content={content} onChange={onChange}>
            <input value={content.fareSubheader} onChange={(e) => onChange({ fareSubheader: e.target.value })} />
          </FieldWithStyle>
          <p className="sa-hint sa-route-style-note">Route row typography applies to all routes below.</p>
          <StyleControls styleKey="routeCity" content={content} onChange={onChange} />
          <StyleControls styleKey="routeValue" content={content} onChange={onChange} />
          {content.routes.slice(0, 5).map((route: FareRoute, i: number) => (
            <div key={i} className="sa-route-row">
              <Field label={`Route ${i + 1} city`}>
                <input
                  value={route.city}
                  onChange={(e) => {
                    const routes = [...content.routes];
                    routes[i] = { ...routes[i], city: e.target.value };
                    onChange({ routes });
                  }}
                />
              </Field>
              <Field label="Code">
                <input
                  value={route.code}
                  maxLength={3}
                  onChange={(e) => {
                    const routes = [...content.routes];
                    routes[i] = { ...routes[i], code: e.target.value.toUpperCase() };
                    onChange({ routes });
                  }}
                />
              </Field>
              <Field label="Transit / value">
                <input
                  value={route.price}
                  onChange={(e) => {
                    const routes = [...content.routes];
                    routes[i] = { ...routes[i], price: e.target.value };
                    onChange({ routes });
                  }}
                />
              </Field>
            </div>
          ))}
        </>
      )}

      {templates.some((t) => t !== 'T0') && (
        <details className="sa-form-group">
          <summary>Footer & legal text</summary>
          <Field label="Phone">
            <input value={content.contactPhone} onChange={(e) => onChange({ contactPhone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input value={content.contactEmail} onChange={(e) => onChange({ contactEmail: e.target.value })} />
          </Field>
          <Field label="Website">
            <input value={content.contactWebsite} onChange={(e) => onChange({ contactWebsite: e.target.value })} />
          </Field>
          <FieldWithStyle label="Conditions line" styleKey="conditions" content={content} onChange={onChange}>
            <textarea
              rows={2}
              value={content.fareConditionsText}
              onChange={(e) => onChange({ fareConditionsText: e.target.value.slice(0, 120) })}
            />
          </FieldWithStyle>
          <FieldWithStyle label="Brand credit" styleKey="credit" content={content} onChange={onChange}>
            <textarea
              rows={2}
              value={content.gsaText}
              onChange={(e) => onChange({ gsaText: e.target.value.slice(0, 120) })}
            />
          </FieldWithStyle>
          <div className="sa-field-group">
            <p className="sa-hint">Contact strip (shared footer)</p>
            <StyleControls styleKey="contact" content={content} onChange={onChange} />
          </div>
        </details>
      )}

      {hasT0 && templates.length === 1 && (
        <p className="sa-hint">T0 is photo-only — all text goes in the post caption.</p>
      )}
    </div>
  );
}

export { templatesNeedPhoto };
