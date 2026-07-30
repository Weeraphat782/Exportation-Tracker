'use client';

import { COLORS, FONTS, GEOMETRY, TYPE, formatPrice, ts } from '../brand';
import { Lockup } from '../Lockup';
import { Movable } from '../Movable';
import { PhotoBackground } from '../PhotoBackground';
import { canvasWidth, type TemplateProps } from './shared';

export function T2c({ content, format }: TemplateProps) {
  const w = canvasWidth(format);
  const panelW = Math.round(w * GEOMETRY.sidePanelMaxWidthRatio);
  const keepClearBottom = format === 'story' ? 320 : 0;
  const keepClearTop = format === 'story' ? 250 : 0;
  const routeS = ts(content, 'route', { size: 42, color: COLORS.white });
  const tripS = ts(content, 'tripType', { size: 24, color: COLORS.white60 });
  const priceS = ts(content, 'price', { size: 50, color: COLORS.green500 });
  const contactS = ts(content, 'contact', { size: 20, color: COLORS.white });
  const fineS = ts(content, 'conditions', { size: 20, color: COLORS.white60 });
  const creditS = ts(content, 'credit', { size: 20, color: COLORS.white60 });

  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: panelW, overflow: 'hidden' }}>
        <Movable id="photo">
          <div style={{ position: 'absolute', inset: 0 }}>
            <PhotoBackground url={content.photoUrl} focusX={content.photoFocusX} focusY={content.photoFocusY} />
          </div>
        </Movable>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: panelW,
          background: COLORS.navy900,
          padding: `${48 + keepClearTop}px 36px ${32 + keepClearBottom}px`,
          boxSizing: 'border-box',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <Movable id="panelContent">
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <Lockup textColor="light" position="top-left" height={90} embedded />
            </div>
            <div style={{ borderTop: `3px solid ${COLORS.green500}`, margin: '32px 16px 0' }} />
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: TYPE.headline.weight,
                fontSize: routeS.fontSize,
                lineHeight: 1.15,
                color: routeS.color,
                marginTop: 36,
                whiteSpace: 'pre-line',
              }}
            >
              {content.routeFrom}
              {'\n'}⇄ {content.routeTo}
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: tripS.fontSize, color: tripS.color, marginTop: 10 }}>
              {content.tripType}
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontWeight: TYPE.data.weight,
                fontSize: priceS.fontSize,
                color: priceS.color,
                marginTop: 32,
              }}
            >
              {formatPrice(content.price)}
            </div>
          </div>
        </Movable>

        <div
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            bottom: 28 + keepClearBottom,
            textAlign: 'center',
          }}
        >
          <Movable id="contact">
            <div
              style={{
                borderTop: `2px solid ${COLORS.green500}`,
                paddingTop: 10,
                fontFamily: FONTS.body,
                fontWeight: TYPE.contact.weight,
                fontSize: contactS.fontSize,
                lineHeight: 1.6,
                color: contactS.color,
              }}
            >
              {content.contactWebsite}
              <br />
              {content.contactPhone}
              <br />
              {content.contactEmail}
            </div>
          </Movable>
          <Movable id="conditions">
            <div
              style={{
                marginTop: 10,
                fontFamily: FONTS.body,
                fontWeight: TYPE.fine.weight,
                fontSize: fineS.fontSize,
                lineHeight: 1.35,
                color: fineS.color,
              }}
            >
              {content.fareConditionsText}
            </div>
          </Movable>
          <Movable id="credit">
            <div
              style={{
                marginTop: 8,
                fontFamily: FONTS.body,
                fontWeight: TYPE.fine.weight,
                fontSize: creditS.fontSize,
                lineHeight: 1.35,
                color: creditS.color,
              }}
            >
              {content.gsaText}
            </div>
          </Movable>
        </div>
      </div>
    </>
  );
}
