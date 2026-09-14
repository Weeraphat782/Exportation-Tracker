import type { CSSProperties } from 'react';
import { interpolate, spring } from 'remotion';
import { TEMPLATE_LAYERS, type TemplateId } from '../brand';

export type AnimationPreset = 'fade' | 'slide' | 'zoom';
export type LayerStyleFn = (id: string) => CSSProperties;

export interface AnimationConfig {
  template: TemplateId;
  frame: number;
  fps: number;
  preset: AnimationPreset;
  durationInFrames: number;
}

function layerStartFrame(layerIndex: number, staggerFrames: number) {
  return layerIndex * staggerFrames;
}

function layerEntranceProgress(frame: number, layerIndex: number, entranceFrames: number, staggerFrames: number) {
  const start = layerStartFrame(layerIndex, staggerFrames);
  const local = frame - start;
  if (local <= 0) return 0;
  if (local >= entranceFrames) return 1;
  return local / entranceFrames;
}

/** Staggered layer entrance + Ken Burns on photo. Pure — safe outside Remotion tree. */
export function createLayerStyleGetter(config: AnimationConfig): LayerStyleFn {
  const { template, frame, fps, preset, durationInFrames } = config;
  const layers = TEMPLATE_LAYERS[template];
  const staggerFrames = Math.max(4, Math.floor(durationInFrames * 0.06));
  const entranceFrames = Math.max(8, Math.floor(fps * 0.5));

  return (id: string) => {
    const layerIndex = layers.findIndex((l) => l.id === id);
    if (layerIndex < 0) return {};

    if (id === 'photo') {
      const kenBurns = interpolate(frame, [0, durationInFrames], [1, 1.08], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      return { transform: `scale(${kenBurns})`, transformOrigin: 'center center' };
    }

    const raw = layerEntranceProgress(frame, layerIndex, entranceFrames, staggerFrames);
    const localFrame = Math.max(0, frame - layerStartFrame(layerIndex, staggerFrames));
    const eased = spring({ frame: localFrame, fps, config: { damping: 200, stiffness: 120 } });
    const opacity = interpolate(raw, [0, 0.15], [0, 1], { extrapolateRight: 'clamp' }) * eased;

    switch (preset) {
      case 'fade':
        return { opacity };
      case 'slide':
        return {
          opacity,
          transform: `translateY(${interpolate(eased, [0, 1], [48, 0])}px)`,
        };
      case 'zoom':
        return {
          opacity,
          transform: `scale(${interpolate(eased, [0, 1], [0.9, 1])})`,
        };
      default:
        return { opacity };
    }
  };
}

/** ponytail: smallest runnable check — fails if stagger order or end-state breaks */
export function runAnimationSelfCheck() {
  const fps = 30;
  const durationInFrames = 90;
  const layers = TEMPLATE_LAYERS.T1;

  const atZero = createLayerStyleGetter({
    template: 'T1',
    frame: 0,
    fps,
    preset: 'slide',
    durationInFrames,
  });
  const firstStyle = atZero(layers[0].id);
  const firstOpacity = typeof firstStyle.opacity === 'number' ? firstStyle.opacity : 1;
  if (firstOpacity > 0.05) {
    throw new Error('first layer should be hidden at frame 0');
  }

  const atEnd = createLayerStyleGetter({
    template: 'T1',
    frame: durationInFrames,
    fps,
    preset: 'slide',
    durationInFrames,
  });
  for (const layer of layers) {
    if (layer.id === 'photo') continue;
    const style = atEnd(layer.id);
    const opacity = typeof style.opacity === 'number' ? style.opacity : 1;
    if (opacity < 0.95) {
      throw new Error(`layer ${layer.id} should be fully visible at end`);
    }
  }

  const orderCheck = layers.map((l, i) => ({
    id: l.id,
    start: layerStartFrame(i, Math.max(4, Math.floor(durationInFrames * 0.06))),
  }));
  for (let i = 1; i < orderCheck.length; i++) {
    if (orderCheck[i].start <= orderCheck[i - 1].start) {
      throw new Error('layer stagger order broken');
    }
  }
}

if (typeof process !== 'undefined' && process.argv.some((a) => a.includes('animation'))) {
  runAnimationSelfCheck();
  console.log('animation self-check ok');
}
