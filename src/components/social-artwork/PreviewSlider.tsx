'use client';

import { useEffect, useRef, useState } from 'react';
import type { HiddenLayers, LayerSizes, LayoutOffsets } from './Movable';
import { CANVAS, TEMPLATE_LAYERS, TEMPLATE_META, type ArtworkContent, type Format, type TemplateId } from './brand';
import { ArtworkPreview } from './ArtworkPreview';

interface PreviewSliderProps {
  templates: TemplateId[];
  content: ArtworkContent;
  format: Format;
  scale?: number;
  designMode?: boolean;
  onDesignModeChange?: (on: boolean) => void;
  layoutOffsets?: Partial<Record<TemplateId, LayoutOffsets>>;
  hiddenLayers?: Partial<Record<TemplateId, HiddenLayers>>;
  layerSizes?: Partial<Record<TemplateId, LayerSizes>>;
  onMove?: (template: TemplateId, id: string, offset: { x: number; y: number }) => void;
  onToggleLayer?: (template: TemplateId, id: string) => void;
  onResize?: (template: TemplateId, id: string, dh: number) => void;
  onResetLayout?: (template: TemplateId) => void;
}

function clampScale(n: number) {
  return Math.min(0.9, Math.max(0.15, n));
}

export function PreviewSlider({
  templates,
  content,
  format,
  scale = 0.32,
  designMode = false,
  onDesignModeChange,
  layoutOffsets = {},
  hiddenLayers = {},
  layerSizes = {},
  onMove,
  onToggleLayer,
  onResize,
  onResetLayout,
}: PreviewSliderProps) {
  const [index, setIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState<number | null>(null);
  const count = templates.length;

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, count - 1)));
  }, [count, templates.join(',')]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const { w, h } = CANVAS[format];
    const ARROW = 48;

    const update = () => {
      const width = el.clientWidth - ARROW;
      if (width <= 0) return;
      const maxH = window.innerHeight * 0.72;
      const byWidth = width / w;
      const byHeight = maxH / h;
      setFitScale(clampScale(Math.min(byWidth, byHeight)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [format]);

  if (count === 0) return null;

  const template = templates[index];
  const previewScale = fitScale ?? scale;
  const templateHidden = hiddenLayers[template] ?? {};
  const hasChanges =
    Object.keys(layoutOffsets[template] ?? {}).length > 0 ||
    Object.values(templateHidden).some(Boolean) ||
    Object.values(layerSizes[template] ?? {}).some((dh) => dh !== 0);

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  return (
    <div className={`sa-preview-slider${designMode ? ' sa-design-mode' : ''}`}>
      <div className="sa-preview-slider-toolbar">
        <button
          type="button"
          className={`sa-btn-design-mode${designMode ? ' active' : ''}`}
          onClick={() => onDesignModeChange?.(!designMode)}
        >
          {designMode ? 'Exit design mode' : 'Design mode'}
        </button>
        {designMode && (
          <button
            type="button"
            className="sa-btn-reset-layout"
            onClick={() => onResetLayout?.(template)}
            disabled={!hasChanges}
          >
            Reset layout
          </button>
        )}
      </div>

      {designMode && (
        <p className="sa-design-mode-hint">Drag any outlined block to reposition it on this template.</p>
      )}

      <div className="sa-preview-slider-header">
        <span className="sa-preview-slider-title">{TEMPLATE_META[template].label}</span>
        {count > 1 && (
          <span className="sa-preview-slider-count">
            {index + 1} / {count}
          </span>
        )}
      </div>

      <div ref={bodyRef} className="sa-preview-slider-body">
        {count > 1 && (
          <button type="button" className="sa-preview-slider-arrow" onClick={prev} aria-label="Previous template">
            ‹
          </button>
        )}
        <ArtworkPreview
          template={template}
          content={content}
          format={format}
          scale={previewScale}
          hideLabel
          designActive={designMode}
          layoutOffsets={layoutOffsets[template] ?? {}}
          hiddenLayers={templateHidden}
          layerSizes={layerSizes[template] ?? {}}
          onMove={(id, offset) => onMove?.(template, id, offset)}
          onResize={(id, dh) => onResize?.(template, id, dh)}
        />
        {count > 1 && (
          <button type="button" className="sa-preview-slider-arrow" onClick={next} aria-label="Next template">
            ›
          </button>
        )}
      </div>

      {count > 1 && (
        <div className="sa-preview-slider-dots">
          {templates.map((t, i) => (
            <button
              key={t}
              type="button"
              className={i === index ? 'dot active' : 'dot'}
              onClick={() => setIndex(i)}
              aria-label={TEMPLATE_META[t].label}
            />
          ))}
        </div>
      )}

      {designMode && (
        <div className="sa-layers-panel">
          <div className="sa-layers-panel-title">Layers</div>
          {TEMPLATE_LAYERS[template].map((layer) => {
            const isHidden = !!templateHidden[layer.id];
            return (
              <div key={layer.id} className={`sa-layer-row${isHidden ? ' hidden' : ''}`}>
                <button
                  type="button"
                  className="sa-layer-eye"
                  onClick={() => onToggleLayer?.(template, layer.id)}
                  aria-label={isHidden ? `Show ${layer.label}` : `Hide ${layer.label}`}
                  title={isHidden ? 'Show layer' : 'Hide layer'}
                >
                  {isHidden ? '◡' : '👁'}
                </button>
                <span className="sa-layer-label">{layer.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
