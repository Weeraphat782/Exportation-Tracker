'use client';

import type { ArtworkContent, Format, TemplateId } from '../brand';
import { T0 } from './T0';
import { T1 } from './T1';
import { T2 } from './T2';
import { T2b } from './T2b';
import { T2c } from './T2c';
import { T3 } from './T3';
import { T4 } from './T4';
import type { TemplateProps } from './shared';

const MAP: Record<TemplateId, (p: TemplateProps) => JSX.Element> = {
  T0,
  T1,
  T2,
  T2b,
  T2c,
  T3,
  T4,
};

export function TemplateRenderer({
  template,
  content,
  format,
}: {
  template: TemplateId;
  content: ArtworkContent;
  format: Format;
}) {
  const C = MAP[template];
  return <C content={content} format={format} />;
}
