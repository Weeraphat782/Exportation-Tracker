'use client';

import { useMemo, useState } from 'react';
import { Player } from '@remotion/player';
import { canRenderMediaOnWeb, renderMediaOnWeb } from '@remotion/web-renderer';
import { Button } from '@/components/ui/button';
import { CANVAS, type ArtworkContent, type Format, type TemplateId } from '../brand';
import type { HiddenLayers, LayerSizes, LayoutOffsets } from '../Movable';
import { ArtworkVideo, type ArtworkVideoProps } from './ArtworkVideo';
import type { AnimationPreset } from './animation';

const FPS = 30;

export interface VideoPanelProps {
  template: TemplateId;
  content: ArtworkContent;
  format: Format;
  layoutOffsets: LayoutOffsets;
  hiddenLayers: HiddenLayers;
  layerSizes: LayerSizes;
  caption: string;
  prompt: string;
  postLabel?: string;
}

function buildInputProps(
  props: VideoPanelProps,
  preset: AnimationPreset,
): ArtworkVideoProps {
  return {
    template: props.template,
    content: props.content,
    format: props.format,
    layoutOffsets: props.layoutOffsets,
    hiddenLayers: props.hiddenLayers,
    layerSizes: props.layerSizes,
    preset,
  };
}

async function saveVideoToAlbum(
  blob: Blob,
  filename: string,
  template: TemplateId,
  fmt: Format,
  caption: string,
  prompt: string,
  source: Record<string, unknown>,
) {
  const fd = new FormData();
  fd.append('file', new File([blob], filename, { type: 'video/mp4' }));
  fd.append('kind', 'video');
  fd.append('template', template);
  fd.append('format', fmt);
  fd.append('label', filename);
  if (caption) fd.append('caption', caption);
  if (prompt) fd.append('prompt', prompt);
  fd.append('source', JSON.stringify(source));
  const res = await fetch('/api/social-artwork/library', { method: 'POST', body: fd });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Album save failed');
  }
}

export function VideoPanel(props: VideoPanelProps) {
  const [durationSec, setDurationSec] = useState(5);
  const [preset, setPreset] = useState<AnimationPreset>('slide');
  const [loop, setLoop] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  const { w, h } = CANVAS[props.format];
  const durationInFrames = durationSec * FPS;
  const inputProps = useMemo(() => buildInputProps(props, preset), [props, preset]);

  const source = useMemo(
    () => ({
      content: props.content,
      layoutOffsets: { [props.template]: props.layoutOffsets },
      hiddenLayers: { [props.template]: props.hiddenLayers },
      layerSizes: { [props.template]: props.layerSizes },
    }),
    [props],
  );

  const renderVideo = async (download: boolean, saveToAlbum: boolean) => {
    const check = await canRenderMediaOnWeb({
      container: 'mp4',
      videoCodec: 'h264',
      width: w,
      height: h,
    });
    if (!check.canRender) {
      const msg = check.issues.map((i) => i.message).join('; ') || 'Browser cannot render MP4 here.';
      throw new Error(msg);
    }

    setRendering(true);
    setProgress(0);
    try {
      const { getBlob } = await renderMediaOnWeb({
        composition: {
          component: ArtworkVideo,
          durationInFrames,
          fps: FPS,
          width: w,
          height: h,
          id: 'artwork-video',
          calculateMetadata: null,
          defaultProps: inputProps,
        },
        inputProps,
        container: 'mp4',
        videoCodec: 'h264',
        muted: true,
        onProgress: (p) => setProgress(Math.round(p.progress * 100)),
      });

      const blob = await getBlob();
      const date = new Date().toISOString().slice(0, 10);
      const filename = `OMGEXP_${props.template}_${props.format}_${date}.mp4`;

      if (download) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      if (saveToAlbum) {
        setSaving(true);
        await saveVideoToAlbum(blob, filename, props.template, props.format, props.caption, props.prompt, source);
      }
    } finally {
      setRendering(false);
      setSaving(false);
      setProgress(0);
    }
  };

  const previewScale = Math.min(1, 360 / w);

  return (
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold">Animated video (Remotion)</h3>
        <p className="text-xs text-muted-foreground">
          Layer entrance animation{props.postLabel ? ` · ${props.postLabel}` : ''}. Renders MP4 in your browser
          (Chrome recommended).
        </p>
      </div>

      <div style={{ width: w * previewScale, height: h * previewScale, maxWidth: '100%' }}>
        <Player
          component={ArtworkVideo}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={w}
          compositionHeight={h}
          fps={FPS}
          loop={loop}
          controls
          style={{ width: '100%' }}
          acknowledgeRemotionLicense
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Duration
          <select
            className="rounded border px-2 py-1 text-sm"
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
          >
            {[3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                {s}s
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Preset
          <select
            className="rounded border px-2 py-1 text-sm"
            value={preset}
            onChange={(e) => setPreset(e.target.value as AnimationPreset)}
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="zoom">Zoom</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          Loop preview
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={rendering || saving}
          onClick={() => void renderVideo(true, false).catch((e) => alert(e instanceof Error ? e.message : 'Render failed'))}
        >
          {rendering && !saving ? `Rendering… ${progress}%` : 'Render & download MP4'}
        </Button>
        <Button
          type="button"
          disabled={rendering || saving}
          onClick={() =>
            void renderVideo(false, true)
              .then(() => alert('Video saved to album.'))
              .catch((e) => alert(e instanceof Error ? e.message : 'Save failed'))
          }
        >
          {saving ? 'Saving…' : 'Save video to album'}
        </Button>
      </div>
    </section>
  );
}
