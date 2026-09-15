'use client';

import type { CSSProperties, ReactNode } from 'react';
import type { Format } from '../brand';
import { COLORS, FONTS, ts } from '../brand';
import { Lockup } from '../Lockup';
import { Movable, MovableLayer } from '../Movable';
import { PhotoBackground } from '../PhotoBackground';
import type { TemplateProps } from './shared';

const GOLD = '#C9A227';
const PANEL = 'rgba(13,44,77,0.72)';

const T5_LAYOUT = {
  linkedin: {
    m: 48,
    lockupH: 72,
    headTop: 108,
    headSize: 52,
    bodyTop: 228,
    bodySize: 18,
    bodyNoteSize: 16,
    cardTop: null as number | null,
    cardBottom: 72,
    cardGap: 16,
    cardMinH: 88,
    cardIcon: 36,
    cardLabel: 13,
    cardText: 18,
    footBottom: 20,
    footSize: 15,
  },
  linkedinSquare: {
    m: 64,
    lockupH: 88,
    headTop: 200,
    headSize: 76,
    bodyTop: 440,
    bodySize: 28,
    bodyNoteSize: 22,
    cardTop: 720,
    cardBottom: null as number | null,
    cardGap: 20,
    cardMinH: 120,
    cardIcon: 44,
    cardLabel: 15,
    cardText: 24,
    footBottom: 56,
    footSize: 18,
  },
  linkedinPortrait: {
    m: 60,
    lockupH: 80,
    headTop: 260,
    headSize: 68,
    bodyTop: 520,
    bodySize: 26,
    bodyNoteSize: 20,
    cardTop: 900,
    cardBottom: null as number | null,
    cardGap: 18,
    cardMinH: 110,
    cardIcon: 40,
    cardLabel: 14,
    cardText: 22,
    footBottom: 64,
    footSize: 17,
  },
} as const;

function t5Cfg(format: Format) {
  return T5_LAYOUT[format as keyof typeof T5_LAYOUT] ?? T5_LAYOUT.linkedin;
}

/** Split on *word* markers and render the wrapped segment in green. */
export function renderHighlight(text: string, color = COLORS.green500): ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} style={{ color }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

/** Split on **word** markers and render bold. */
export function renderBold(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function StatusCard({
  tone,
  label,
  text,
  minH,
  iconSize,
  labelSize,
  textSize,
}: {
  tone: 'reject' | 'accept';
  label: string;
  text: string;
  minH: number;
  iconSize: number;
  labelSize: number;
  textSize: number;
}) {
  const accent = tone === 'reject' ? GOLD : COLORS.green500;
  const icon = tone === 'reject' ? '✕' : '✓';
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '16px 18px',
        background: PANEL,
        borderLeft: `4px solid ${accent}`,
        borderRadius: 4,
        minHeight: minH,
      }}
    >
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          border: `2px solid ${accent}`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: iconSize * 0.5,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: labelSize,
            letterSpacing: '0.12em',
            color: accent,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONTS.body,
            fontWeight: 600,
            fontSize: textSize,
            lineHeight: 1.25,
            color: COLORS.white,
            whiteSpace: 'pre-line',
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

export function T5({ content, format }: TemplateProps) {
  const cfg = t5Cfg(format);
  const headlineS = ts(content, 'headline', { size: cfg.headSize, color: COLORS.white });
  const bodyS = ts(content, 'body', { size: cfg.bodySize, color: COLORS.white90 });
  const eyebrowS = ts(content, 'eyebrow', { size: 13, color: COLORS.navy900 });

  const cardsStyle: CSSProperties = {
    position: 'absolute',
    left: cfg.m + 8,
    right: cfg.m,
    zIndex: 3,
    display: 'flex',
    gap: cfg.cardGap,
    ...(cfg.cardBottom != null ? { bottom: cfg.cardBottom } : { top: cfg.cardTop! }),
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${COLORS.navy900} 0%, #0a2340 55%, ${COLORS.navy700} 100%)`,
          zIndex: 0,
        }}
      />
      <Movable id="photo">
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <PhotoBackground url={content.photoUrl} focusX={content.photoFocusX} focusY={content.photoFocusY} />
        </div>
      </Movable>
      <Movable id="scrim">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, rgba(13,44,77,.92) 0%, rgba(13,44,77,.78) 45%, rgba(13,44,77,.55) 100%)`,
            zIndex: 1,
          }}
        />
      </Movable>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 6,
          background: COLORS.green500,
          zIndex: 2,
        }}
      />
      <svg
        style={{ position: 'absolute', right: 0, bottom: 0, width: 420, height: 320, zIndex: 1, opacity: 0.35 }}
        viewBox="0 0 420 320"
        aria-hidden
      >
        <path
          d="M420 320 C280 280 180 200 120 80 C80 20 40 0 0 40 L420 40 Z"
          fill={COLORS.green500}
          opacity="0.15"
        />
        <path
          d="M420 320 C320 300 220 220 160 120 C120 60 60 20 0 60"
          fill="none"
          stroke={COLORS.navy200}
          strokeWidth="2"
          opacity="0.4"
        />
      </svg>
      <MovableLayer id="lockup">
        <div style={{ position: 'absolute', top: cfg.m - 8, left: cfg.m + 8, zIndex: 4 }}>
          <Lockup textColor="light" position="top-left" height={cfg.lockupH} embedded />
        </div>
      </MovableLayer>
      <Movable id="badge">
        {content.eyebrow && (
          <div
            style={{
              position: 'absolute',
              top: cfg.m,
              right: cfg.m,
              zIndex: 4,
              background: COLORS.green500,
              color: eyebrowS.color,
              fontFamily: FONTS.display,
              fontWeight: 700,
              fontSize: eyebrowS.fontSize,
              letterSpacing: '0.1em',
              padding: '10px 18px',
              borderRadius: 999,
              textTransform: 'uppercase',
            }}
          >
            {content.eyebrow}
          </div>
        )}
      </Movable>
      <Movable id="headline">
        {content.headline && (
          <div
            style={{
              position: 'absolute',
              top: cfg.headTop,
              left: cfg.m + 8,
              right: cfg.m,
              zIndex: 3,
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: headlineS.fontSize,
              lineHeight: 1.08,
              color: headlineS.color,
              textTransform: 'uppercase',
              whiteSpace: 'pre-line',
            }}
          >
            {renderHighlight(content.headline)}
          </div>
        )}
      </Movable>
      <Movable id="body">
        <div
          style={{
            position: 'absolute',
            top: cfg.bodyTop,
            left: cfg.m + 8,
            right: cfg.m,
            zIndex: 3,
          }}
        >
          {content.body && (
            <div
              style={{
                fontFamily: FONTS.body,
                fontWeight: 400,
                fontSize: bodyS.fontSize,
                lineHeight: 1.45,
                color: bodyS.color,
              }}
            >
              {renderBold(content.body)}
            </div>
          )}
          {content.bodyNote && (
            <div
              style={{
                marginTop: 10,
                fontFamily: FONTS.body,
                fontWeight: 400,
                fontSize: cfg.bodyNoteSize,
                lineHeight: 1.4,
                color: COLORS.white60,
              }}
            >
              {content.bodyNote}
            </div>
          )}
        </div>
      </Movable>
      <Movable id="cards">
        <div style={cardsStyle}>
          <StatusCard
            tone="reject"
            label={content.rejectLabel}
            text={content.rejectText}
            minH={cfg.cardMinH}
            iconSize={cfg.cardIcon}
            labelSize={cfg.cardLabel}
            textSize={cfg.cardText}
          />
          <StatusCard
            tone="accept"
            label={content.acceptLabel}
            text={content.acceptText}
            minH={cfg.cardMinH}
            iconSize={cfg.cardIcon}
            labelSize={cfg.cardLabel}
            textSize={cfg.cardText}
          />
        </div>
      </Movable>
      <Movable id="footer">
        <div
          style={{
            position: 'absolute',
            left: cfg.m + 8,
            right: cfg.m,
            bottom: cfg.footBottom,
            zIndex: 4,
            borderTop: `1px solid ${COLORS.white60}`,
            paddingTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontFamily: FONTS.body,
            fontSize: cfg.footSize,
            color: COLORS.white,
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{content.airlineName}</div>
          <div style={{ color: COLORS.white90, flex: 1, textAlign: 'center' }}>{content.routeLine}</div>
          <div style={{ fontWeight: 600 }}>{content.contactWebsite}</div>
        </div>
      </Movable>
    </>
  );
}

/** ponytail: fails if highlight marker split breaks */
export function runT5HighlightSelfCheck() {
  const nodes = renderHighlight('PERMIT MUST *MATCH* THE');
  if (!Array.isArray(nodes) || nodes.length < 3) {
    throw new Error('renderHighlight should split into 3 parts');
  }
  const mid = nodes[1];
  if (typeof mid !== 'object' || mid === null || !('props' in mid)) {
    throw new Error('middle segment should be a highlighted span');
  }
}

if (typeof process !== 'undefined' && process.argv.some((a) => a.includes('T5'))) {
  runT5HighlightSelfCheck();
  console.log('T5 highlight self-check ok');
}
