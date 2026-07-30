'use client';

import { forwardRef } from 'react';
import { CANVAS, GEOMETRY, type Format, type LockupPosition, type LockupTextColor } from './brand';

const LOGO_SRC = '/logo/OMG-LOGO-Color.png';

interface LockupProps {
  textColor: LockupTextColor;
  position: LockupPosition;
  height?: number;
  format?: Format;
  embedded?: boolean;
}

function LockupInner({ textColor, height }: { textColor: LockupTextColor; height: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- html-to-image needs a plain <img> on the canvas
    <img
      src={LOGO_SRC}
      alt="OMGEXP"
      style={{
        height,
        width: 'auto',
        display: 'block',
        // ponytail: no white logo asset exists — invert the color logo on dark backgrounds
        filter: textColor === 'light' ? 'brightness(0) invert(1)' : undefined,
      }}
    />
  );
}

export const Lockup = forwardRef<HTMLDivElement, LockupProps>(function Lockup(
  { textColor, position, height = GEOMETRY.lockupHeight, format = 'post', embedded = false },
  ref,
) {
  if (embedded) {
    return <LockupInner textColor={textColor} height={height} />;
  }

  const m = GEOMETRY.safeMargin;
  const top = format === 'story' ? CANVAS.story.keepClearTop + 16 : m;
  const bottom = format === 'story' ? CANVAS.story.keepClearBottom + 16 : m;

  const style: React.CSSProperties = {
    position: 'absolute',
    zIndex: 4,
    ...(position === 'top-right'
      ? { top, right: m }
      : position === 'top-left'
        ? { top, left: m }
        : { bottom, left: m }),
  };

  return (
    <div ref={ref} style={style}>
      <LockupInner textColor={textColor} height={height} />
    </div>
  );
});
