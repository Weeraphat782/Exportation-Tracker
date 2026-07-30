'use client';

import { COLORS, FONTS, GEOMETRY, formatPrice, ts } from '../brand';
import { Footer } from '../Footer';
import { Lockup } from '../Lockup';
import { Movable, MovableLayer } from '../Movable';
import { PhotoBackground } from '../PhotoBackground';
import type { TemplateProps } from './shared';

export function T2b({ content, format }: TemplateProps) {
  const m = GEOMETRY.safeMargin;
  const keepClear = format === 'story' ? 320 : 0;
  const pillText =
    content.pillText || `${content.routeFrom} ⇄ ${content.routeTo} · ${formatPrice(content.price)}`;
  const pillS = ts(content, 'pill', { size: 34, color: COLORS.navy900 });

  return (
    <>
      <Movable id="photo">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <PhotoBackground url={content.photoUrl} focusX={content.photoFocusX} focusY={content.photoFocusY} />
        </div>
      </Movable>
      <Movable id="gradient">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(13,44,77,0) 55%, rgba(13,44,77,.82) 100%)',
            zIndex: 1,
          }}
        />
      </Movable>
      <MovableLayer id="lockup">
        <Lockup textColor={content.lockupTextColor} position={content.lockupPosition} format={format} />
      </MovableLayer>
      <Movable id="pill">
        <div
          style={{
            position: 'absolute',
            left: m,
            bottom: 220 + keepClear,
            background: COLORS.green500,
            borderRadius: 999,
            padding: '18px 36px',
            fontFamily: FONTS.body,
            fontWeight: 700,
            fontSize: pillS.fontSize,
            color: pillS.color,
            zIndex: 3,
          }}
        >
          {pillText}
        </div>
      </Movable>
      <Footer tone="dark" content={content} showFareConditions format={format} />
    </>
  );
}
