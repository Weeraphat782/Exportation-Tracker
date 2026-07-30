'use client';

import { COLORS, FONTS, GEOMETRY, TYPE, ts } from '../brand';
import { Footer } from '../Footer';
import { Lockup } from '../Lockup';
import { Movable, MovableLayer } from '../Movable';
import type { TemplateProps } from './shared';

export function T3({ content, format }: TemplateProps) {
  const m = GEOMETRY.safeMargin;
  const contentTop = format === 'story' ? 640 : 340;
  const eyebrowS = ts(content, 'eyebrow', { size: TYPE.kicker.size, color: COLORS.green500 });
  const headlineS = ts(content, 'headline', { size: 88, color: COLORS.navy900 });
  const bodyS = ts(content, 'body', { size: TYPE.body.size, color: COLORS.ink });

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: COLORS.canvas }} />
      <div
        style={{
          position: 'absolute',
          inset: 40,
          border: `3px solid ${COLORS.navy700}`,
          borderRadius: 4,
          zIndex: 1,
        }}
      />
      <MovableLayer id="lockup">
        <Lockup textColor="dark" position="top-left" height={100} format={format} />
      </MovableLayer>
      <Movable id="text">
        <div
          style={{
            position: 'absolute',
            top: contentTop,
            left: m + 20,
            right: m + 20,
            textAlign: 'center',
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
                lineHeight: 1.15,
                color: headlineS.color,
                marginTop: 20,
                whiteSpace: 'pre-line',
              }}
            >
              {content.headline}
            </div>
          )}
          {content.body && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontWeight: TYPE.body.weight,
                fontSize: bodyS.fontSize,
                color: bodyS.color,
                marginTop: 32,
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {content.body}
            </div>
          )}
        </div>
      </Movable>
      <Footer tone="light" content={content} centered format={format} />
    </>
  );
}
