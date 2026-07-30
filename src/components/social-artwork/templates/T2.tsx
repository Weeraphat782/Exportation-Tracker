'use client';

import { COLORS, FONTS, GEOMETRY, TYPE, formatPrice, ts } from '../brand';
import { Lockup } from '../Lockup';
import { Movable, MovableLayer } from '../Movable';
import { PhotoBackground } from '../PhotoBackground';
import { canvasHeight, type TemplateProps } from './shared';

export function T2({ content, format }: TemplateProps) {
  const m = GEOMETRY.safeMargin;
  const h = canvasHeight(format);
  const panelH = Math.round(h * GEOMETRY.panelMaxHeightRatio);
  const keepClear = format === 'story' ? 320 : 0;
  const routeS = ts(content, 'route', { size: 48, color: COLORS.navy900 });
  const tripS = ts(content, 'tripType', { size: 26, color: COLORS.ink60 });
  const priceS = ts(content, 'price', { size: TYPE.data.size, color: COLORS.navy900 });
  const contactS = ts(content, 'contact', { size: TYPE.contact.size, color: COLORS.navy900 });
  const fineS = ts(content, 'conditions', { size: TYPE.fine.size, color: COLORS.ink60 });
  const creditS = ts(content, 'credit', { size: TYPE.fine.size, color: COLORS.ink60 });

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <Movable id="photo">
          <div style={{ position: 'absolute', inset: 0 }}>
            <PhotoBackground url={content.photoUrl} focusX={content.photoFocusX} focusY={content.photoFocusY} />
          </div>
        </Movable>
      </div>
      <MovableLayer id="lockup">
        <Lockup textColor={content.lockupTextColor} position={content.lockupPosition} format={format} />
      </MovableLayer>
      <Movable id="panel" resizableHeight>
        <div
          style={{
            position: 'absolute',
            bottom: keepClear,
            left: 0,
            right: 0,
            height: panelH,
            background: COLORS.green500,
            padding: `20px ${m}px 14px`,
            zIndex: 2,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
            <div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: TYPE.subhead.weight,
                  fontSize: routeS.fontSize,
                  lineHeight: 1.1,
                  color: routeS.color,
                }}
              >
                {content.routeFrom} ⇄ {content.routeTo}
              </div>
              <div
                style={{
                  fontFamily: FONTS.body,
                  fontWeight: TYPE.body.weight,
                  fontSize: tripS.fontSize,
                  color: tripS.color,
                  marginTop: 4,
                }}
              >
                {content.tripType}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: TYPE.data.weight,
                  fontSize: priceS.fontSize,
                  lineHeight: 1,
                  color: priceS.color,
                }}
              >
                {formatPrice(content.price)}
              </div>
            </div>
          </div>
          <div>
            <Movable id="contact">
              <div
                style={{
                  borderTop: `2px solid ${COLORS.navy900}`,
                  paddingTop: 8,
                  fontFamily: FONTS.body,
                  fontWeight: TYPE.contact.weight,
                  fontSize: contactS.fontSize,
                  color: contactS.color,
                }}
              >
                {content.contactWebsite} · {content.contactPhone} · {content.contactEmail}
              </div>
            </Movable>
            <Movable id="conditions">
              <div
                style={{
                  marginTop: 6,
                  fontFamily: FONTS.body,
                  fontWeight: TYPE.fine.weight,
                  fontSize: fineS.fontSize,
                  color: fineS.color,
                }}
              >
                {content.fareConditionsText}
              </div>
            </Movable>
            <Movable id="credit">
              <div
                style={{
                  marginTop: 4,
                  fontFamily: FONTS.body,
                  fontWeight: TYPE.fine.weight,
                  fontSize: creditS.fontSize,
                  color: creditS.color,
                }}
              >
                {content.gsaText}
              </div>
            </Movable>
          </div>
        </div>
      </Movable>
    </>
  );
}
