'use client';

import { COLORS, FONTS, GEOMETRY, TYPE, ts } from '../brand';
import { Footer } from '../Footer';
import { Lockup } from '../Lockup';
import { Movable, MovableLayer } from '../Movable';
import { PhotoBackground } from '../PhotoBackground';
import type { TemplateProps } from './shared';

export function T1({ content, format }: TemplateProps) {
  const m = GEOMETRY.safeMargin;
  const keepClear = format === 'story' ? 320 : 0;
  const textBottom = 200 + keepClear;
  const eyebrowS = ts(content, 'eyebrow', { size: TYPE.kicker.size, color: COLORS.green500 });
  const headlineS = ts(content, 'headline', { size: TYPE.headline.max, color: COLORS.white });
  const subheadS = ts(content, 'subhead', { size: TYPE.body.size, color: COLORS.white90 });

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
            background: `linear-gradient(180deg, rgba(13,44,77,0) 35%, rgba(13,44,77,.82) 100%)`,
            zIndex: 1,
          }}
        />
      </Movable>
      <MovableLayer id="lockup">
        <Lockup textColor={content.lockupTextColor} position={content.lockupPosition} format={format} />
      </MovableLayer>
      <Movable id="text">
        <div
          style={{
            position: 'absolute',
            left: m,
            right: m,
            bottom: textBottom,
            zIndex: 3,
          }}
        >
          {content.eyebrow && (
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: TYPE.kicker.weight,
                fontSize: eyebrowS.fontSize,
                letterSpacing: TYPE.kicker.ls,
                textTransform: 'uppercase',
                color: eyebrowS.color,
                marginBottom: 16,
              }}
            >
              {content.eyebrow}
            </div>
          )}
          {content.headline && (
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: TYPE.headline.weight,
                fontSize: headlineS.fontSize,
                lineHeight: TYPE.headline.lh,
                color: headlineS.color,
                whiteSpace: 'pre-line',
              }}
            >
              {content.headline}
            </div>
          )}
          {content.subhead && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontWeight: TYPE.body.weight,
                fontSize: subheadS.fontSize,
                color: subheadS.color,
                marginTop: 16,
              }}
            >
              {content.subhead}
            </div>
          )}
        </div>
      </Movable>
      <Footer tone="dark" content={content} format={format} />
    </>
  );
}
