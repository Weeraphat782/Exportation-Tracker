'use client';

import { COLORS, FONTS, GEOMETRY, TYPE, formatPrice, ts } from '../brand';
import { Footer } from '../Footer';
import { Lockup } from '../Lockup';
import { Movable } from '../Movable';
import type { TemplateProps } from './shared';

export function T4({ content, format }: TemplateProps) {
  const m = GEOMETRY.safeMargin;
  const headerH = 184;
  const headerTop = format === 'story' ? 250 : 0;
  const fareHeaderS = ts(content, 'fareHeader', { size: TYPE.contact.size, color: COLORS.white });
  const fareSubS = ts(content, 'fareSubheader', { size: TYPE.contact.size, color: COLORS.white });
  const routeCityS = ts(content, 'routeCity', { size: 52, color: COLORS.white });
  const routeValueS = ts(content, 'routeValue', { size: TYPE.data.size, color: COLORS.green500 });

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: COLORS.navy900 }} />
      <Movable id="header">
        <div
          style={{
            position: 'absolute',
            top: headerTop,
            left: 0,
            right: 0,
            height: headerH,
            background: COLORS.navy700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${m}px`,
            zIndex: 2,
          }}
        >
          <Lockup textColor="light" position="top-left" height={90} embedded />
          <div style={{ textAlign: 'right', lineHeight: 1.4 }}>
            <div
              style={{
                fontFamily: FONTS.body,
                fontWeight: TYPE.contact.weight,
                fontSize: fareHeaderS.fontSize,
                color: fareHeaderS.color,
              }}
            >
              {content.fareHeader}
            </div>
            <div
              style={{
                fontFamily: FONTS.body,
                fontWeight: TYPE.contact.weight,
                fontSize: fareSubS.fontSize,
                color: fareSubS.color,
              }}
            >
              {content.fareSubheader}
            </div>
          </div>
        </div>
      </Movable>
      <Movable id="routes">
        <div style={{ position: 'absolute', top: headerTop + headerH + 36, left: m, right: m, zIndex: 2 }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: TYPE.kicker.weight,
              fontSize: 24,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: COLORS.green500,
            }}
          >
            Bangkok departures · airport-to-airport transit
          </div>
          {content.routes.slice(0, 5).map((route, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '28px 0 22px',
                borderBottom: `1px solid rgba(111,190,68,.35)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: TYPE.subhead.weight,
                  fontSize: routeCityS.fontSize,
                  color: routeCityS.color,
                }}
              >
                {route.city}{' '}
                <span style={{ fontFamily: FONTS.body, fontWeight: 400, fontSize: 24, color: COLORS.white60 }}>
                  {route.code}
                </span>
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: TYPE.data.weight,
                  fontSize: routeValueS.fontSize,
                  color: routeValueS.color,
                }}
              >
                {formatPrice(route.price)}
              </div>
            </div>
          ))}
        </div>
      </Movable>
      <Footer tone="dark" content={content} showFareConditions centered format={format} />
    </>
  );
}
