'use client';

import { useState } from 'react';
import type { AlignGuides, HiddenLayers, LayerSizes, LayoutOffsets } from './Movable';
import type { ArtworkContent, Format, TemplateId } from './brand';
import { CANVAS, TEMPLATE_META } from './brand';
import { ArtworkStage } from './ArtworkStage';
import { DesignProvider } from './Movable';
import { TemplateRenderer } from './templates';

interface ArtworkPreviewProps {
  template: TemplateId;
  content: ArtworkContent;
  format: Format;
  scale?: number;
  hideLabel?: boolean;
  designActive?: boolean;
  layoutOffsets?: LayoutOffsets;
  hiddenLayers?: HiddenLayers;
  layerSizes?: LayerSizes;
  onMove?: (id: string, offset: { x: number; y: number }) => void;
  onResize?: (id: string, dh: number) => void;
}

export function ArtworkPreview({
  template,
  content,
  format,
  scale,
  hideLabel,
  designActive = false,
  layoutOffsets = {},
  hiddenLayers = {},
  layerSizes = {},
  onMove = () => {},
  onResize = () => {},
}: ArtworkPreviewProps) {
  const { w, h } = CANVAS[format];
  const previewScale = scale ?? (format === 'post' ? 0.28 : 0.18);
  const [guides, setGuides] = useState<AlignGuides>({ v: null, h: null });

  return (
    <div className="sa-preview-card">
      {!hideLabel && <div className="sa-preview-card-label">{TEMPLATE_META[template].label}</div>}
      <div className="sa-preview-frame" style={{ width: w * previewScale, height: h * previewScale }}>
        <div
          style={{
            transform: `scale(${previewScale})`,
            transformOrigin: 'top left',
            width: w,
            height: h,
            position: 'relative',
          }}
        >
          <DesignProvider
            active={designActive}
            scale={previewScale}
            offsets={layoutOffsets}
            hidden={hiddenLayers}
            sizes={layerSizes}
            onMove={onMove}
            onResize={onResize}
            onGuides={setGuides}
          >
            <ArtworkStage format={format}>
              <TemplateRenderer template={template} content={content} format={format} />
            </ArtworkStage>
          </DesignProvider>
          {designActive && guides.v !== null && <div className="sa-align-guide-v" style={{ left: guides.v }} />}
          {designActive && guides.h !== null && <div className="sa-align-guide-h" style={{ top: guides.h }} />}
        </div>
      </div>
    </div>
  );
}
