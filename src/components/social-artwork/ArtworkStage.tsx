'use client';

import type { ReactNode } from 'react';
import type { Format } from './brand';
import { CANVAS, COLORS } from './brand';

interface ArtworkStageProps {
  format: Format;
  children: ReactNode;
  exportRef?: React.Ref<HTMLDivElement>;
}

export function ArtworkStage({ format, children, exportRef }: ArtworkStageProps) {
  const { w, h } = CANVAS[format];
  return (
    <div className="stage-outer">
      <div
        ref={exportRef}
        className="stage-canvas"
        style={{ width: w, height: h, position: 'relative', overflow: 'hidden', background: COLORS.navy900 }}
      >
        {children}
      </div>
    </div>
  );
}
