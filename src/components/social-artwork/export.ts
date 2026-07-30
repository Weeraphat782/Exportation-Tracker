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

export async function exportAllArtwork(
  items: { node: HTMLElement; template: TemplateId; format: Format }[],
  onExported?: (dataUrl: string, filename: string, template: TemplateId, format: Format) => Promise<void> | void,
): Promise<number> {
  const date = new Date().toISOString().slice(0, 10);
  let count = 0;
  for (const { node, template, format } of items) {
    const { w, h } = CANVAS[format];
    await waitForImages(node);
    const dataUrl = await toPng(node, {
      width: w,
      height: h,
      pixelRatio: 1,
      cacheBust: true,
    });
    const filename = `OMGEXP_${template}_${format}_${date}.png`;
    triggerDownload(dataUrl, filename);
    if (onExported) await onExported(dataUrl, filename, template, format);
    count++;
    await new Promise((r) => setTimeout(r, 400));
  }
  return count;
}
