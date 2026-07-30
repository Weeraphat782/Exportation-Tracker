import { toPng } from 'html-to-image';
import type { Format, TemplateId } from './brand';
import { CANVAS } from './brand';

async function waitForImages(node: HTMLElement) {
  const imgs = [...node.querySelectorAll('img')];
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  a.click();
}

export interface ExportArtworkItem {
  node: HTMLElement;
  template: TemplateId;
  format: Format;
  index: number;
}

export interface ExportOptions {
  /** Default true — set false for Submit-to-album only */
  download?: boolean;
  onExported?: (
    dataUrl: string,
    filename: string,
    template: TemplateId,
    format: Format,
    index: number,
  ) => Promise<void> | void;
}

export async function exportAllArtwork(items: ExportArtworkItem[], options?: ExportOptions): Promise<number> {
  const download = options?.download !== false;
  const date = new Date().toISOString().slice(0, 10);
  let count = 0;
  for (const { node, template, format, index } of items) {
    const { w, h } = CANVAS[format];
    await waitForImages(node);
    const dataUrl = await toPng(node, {
      width: w,
      height: h,
      pixelRatio: 1,
      cacheBust: true,
      // ponytail: photo URLs differ only by ?key= — default cache key strips query string
      includeQueryParams: true,
    });
    const suffix = items.length > 1 ? `_${String(index + 1).padStart(2, '0')}` : '';
    const filename = `OMGEXP_${template}_${format}_${date}${suffix}.png`;
    if (download) triggerDownload(dataUrl, filename);
    if (options?.onExported) await options.onExported(dataUrl, filename, template, format, index);
    count++;
    if (download) await new Promise((r) => setTimeout(r, 400));
  }
  return count;
}
