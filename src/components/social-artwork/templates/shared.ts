import type { ArtworkContent, Format } from '../brand';
import { CANVAS } from '../brand';

export interface TemplateProps {
  content: ArtworkContent;
  format: Format;
}

export function contentTop(format: Format) {
  return format === 'story' ? CANVAS.story.keepClearTop : 0;
}

export function contentBottom(format: Format) {
  return format === 'story' ? CANVAS.story.keepClearBottom : 0;
}

export function canvasHeight(format: Format) {
  return CANVAS[format].h;
}

export function canvasWidth(format: Format) {
  return CANVAS[format].w;
}
