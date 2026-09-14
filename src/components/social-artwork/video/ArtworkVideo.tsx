'use client';

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArtworkStage } from '../ArtworkStage';
import { CANVAS, COLORS, type ArtworkContent, type Format, type TemplateId } from '../brand';
import {
  AnimationProvider,
  DesignProvider,
  type HiddenLayers,
  type LayerSizes,
  type LayoutOffsets,
} from '../Movable';
import { TemplateRenderer } from '../templates';
import { createLayerStyleGetter, type AnimationPreset } from './animation';

export type ArtworkVideoProps = {
  template: TemplateId;
  content: ArtworkContent;
  format: Format;
  layoutOffsets: LayoutOffsets;
  hiddenLayers: HiddenLayers;
  layerSizes: LayerSizes;
  preset: AnimationPreset;
};

export function ArtworkVideo({
  template,
  content,
  format,
  layoutOffsets,
  hiddenLayers,
  layerSizes,
  preset,
}: ArtworkVideoProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const getLayerStyle = createLayerStyleGetter({
    template,
    frame,
    fps,
    preset,
    durationInFrames,
  });
  const { w, h } = CANVAS[format];

  return (
    <AbsoluteFill style={{ width: w, height: h, background: COLORS.navy900 }}>
      <ArtworkStage format={format}>
        <DesignProvider
          active={false}
          scale={1}
          offsets={layoutOffsets}
          hidden={hiddenLayers}
          sizes={layerSizes}
          onMove={() => {}}
        >
          <AnimationProvider value={getLayerStyle}>
            <TemplateRenderer template={template} content={content} format={format} />
          </AnimationProvider>
        </DesignProvider>
      </ArtworkStage>
    </AbsoluteFill>
  );
}
