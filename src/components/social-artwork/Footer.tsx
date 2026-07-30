'use client';

import { CANVAS, COLORS, FONTS, GEOMETRY, TYPE, ts, type ArtworkContent, type Format } from './brand';
import { Movable } from './Movable';

interface FooterProps {
  tone: 'light' | 'dark';
  content: ArtworkContent;
  format?: Format;
  showFareConditions?: boolean;
  stacked?: boolean;
  centered?: boolean;
}

export function Footer({
  tone,
  content,
  format = 'post',
  showFareConditions,
  stacked,
  centered,
}: FooterProps) {
  const m = GEOMETRY.safeMargin;
  const text = tone === 'light' ? COLORS.ink : COLORS.white;
  const muted = tone === 'light' ? COLORS.ink60 : COLORS.white60;
  const rule = tone === 'light' ? COLORS.navy700 : COLORS.green500;
  const keepClear = format === 'story' ? CANVAS.story.keepClearBottom : 0;

  const contactStyle = ts(content, 'contact', { size: TYPE.contact.size, color: text });
  const conditionsStyle = ts(content, 'conditions', { size: TYPE.fine.size, color: muted });
  const creditStyle = ts(content, 'credit', { size: TYPE.fine.size, color: muted });

  // Stack from actual line boxes (~1.2 × fontSize), not bare font size — bare size makes lines overlap
  const lineBox = (fontSize: number) => Math.ceil(fontSize * 1.2);
  const creditBottom = GEOMETRY.footer.creditBottom + keepClear;
  const conditionsBottom = creditBottom + lineBox(creditStyle.fontSize) + GEOMETRY.footer.conditionsAboveCredit;
  const contactBottom =
    (showFareConditions
      ? conditionsBottom + lineBox(conditionsStyle.fontSize)
      : creditBottom + lineBox(creditStyle.fontSize)) + GEOMETRY.footer.contactAboveConditions;

  return (
    <>
      <Movable id="contact">
        <div
          style={{
            position: 'absolute',
            left: m,
            right: m,
            bottom: contactBottom,
            borderTop: `2px solid ${rule}`,
            paddingTop: 10,
            fontFamily: FONTS.body,
            fontWeight: TYPE.contact.weight,
            fontSize: contactStyle.fontSize,
            letterSpacing: TYPE.contact.ls,
            color: contactStyle.color,
            textAlign: centered ? 'center' : 'left',
            zIndex: 4,
            lineHeight: stacked ? 1.6 : 1.2,
          }}
        >
          {stacked ? (
            <>
              {content.contactWebsite} · {content.contactPhone}
              <br />
              {content.contactEmail}
            </>
          ) : (
            <>
              {content.contactWebsite} · {content.contactPhone} · {content.contactEmail}
            </>
          )}
        </div>
      </Movable>
      {showFareConditions && (
        <Movable id="conditions">
          <div
            style={{
              position: 'absolute',
              left: m,
              right: m,
              bottom: conditionsBottom,
              fontFamily: FONTS.body,
              fontWeight: TYPE.fine.weight,
              fontSize: conditionsStyle.fontSize,
              color: conditionsStyle.color,
              textAlign: centered ? 'center' : 'left',
              zIndex: 4,
            }}
          >
            {content.fareConditionsText}
          </div>
        </Movable>
      )}
      <Movable id="credit">
        <div
          style={{
            position: 'absolute',
            left: m,
            right: m,
            bottom: creditBottom,
            fontFamily: FONTS.body,
            fontWeight: TYPE.fine.weight,
            fontSize: creditStyle.fontSize,
            color: creditStyle.color,
            textAlign: centered ? 'center' : 'left',
            zIndex: 4,
          }}
        >
          {content.gsaText}
        </div>
      </Movable>
    </>
  );
}
