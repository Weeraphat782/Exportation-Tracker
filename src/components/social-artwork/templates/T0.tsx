'use client';

import { Lockup } from '../Lockup';
import { Movable, MovableLayer } from '../Movable';
import { PhotoBackground } from '../PhotoBackground';
import type { TemplateProps } from './shared';

export function T0({ content, format }: TemplateProps) {
  return (
    <>
      <Movable id="photo">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <PhotoBackground url={content.photoUrl} focusX={content.photoFocusX} focusY={content.photoFocusY} />
        </div>
      </Movable>
      <MovableLayer id="lockup">
        <Lockup textColor={content.lockupTextColor} position={content.lockupPosition} format={format} />
      </MovableLayer>
    </>
  );
}
