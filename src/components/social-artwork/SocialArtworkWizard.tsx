'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CANVAS,
  defaultContent,
  type ArtworkContent,
  type Format,
  type TemplateId,
} from './brand';
import { ArtworkPreview } from './ArtworkPreview';
import { PreviewSlider } from './PreviewSlider';
import { ArtworkStage } from './ArtworkStage';
import { ContentForm, templatesNeedPhoto } from './ContentForm';
import { DesignProvider, type HiddenLayers, type LayerSizes, type LayoutOffsets } from './Movable';
import { TemplatePicker } from './TemplatePicker';
import { exportAllArtwork } from './export';
import { TemplateRenderer } from './templates';
import './social-artwork.css';

const STEPS = [
  { id: 'templates', label: 'Templates' },
  { id: 'format', label: 'Format' },
  { id: 'image', label: 'Image' },
  { id: 'content', label: 'Content' },
  { id: 'download', label: 'Download' },
] as const;

export interface LibraryItem {
  id: string;
  kind: 'photo' | 'artwork';
  url: string;
  label: string | null;
  template: string | null;
  format: string | null;
  created_at: string;
}

type StepId = (typeof STEPS)[number]['id'];
type LayoutOffsetsMap = Partial<Record<TemplateId, LayoutOffsets>>;
type HiddenLayersMap = Partial<Record<TemplateId, HiddenLayers>>;
type LayerSizesMap = Partial<Record<TemplateId, LayerSizes>>;

export default function SocialArtworkWizard() {
  const [step, setStep] = useState<StepId>('templates');
  const [selectedTemplates, setSelectedTemplates] = useState<TemplateId[]>(['T1']);
  const [format, setFormat] = useState<Format>('post');
  const [content, setContent] = useState<ArtworkContent>(() => defaultContent('T1'));
  const [exporting, setExporting] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [layoutOffsets, setLayoutOffsets] = useState<LayoutOffsetsMap>({});
  const [hiddenLayers, setHiddenLayers] = useState<HiddenLayersMap>({});
  const [layerSizes, setLayerSizes] = useState<LayerSizesMap>({});
  const [albumPhotos, setAlbumPhotos] = useState<LibraryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashCount, setUnsplashCount] = useState(4);
  const [fetchingUnsplash, setFetchingUnsplash] = useState(false);
  const exportRefs = useRef<Partial<Record<TemplateId, HTMLDivElement | null>>>({});

  useEffect(() => {
    fetch('/api/social-artwork/library?kind=photo')
      .then((r) => r.json())
      .then((d) => setAlbumPhotos(d.items ?? []))
      .catch(() => {});
  }, []);

  const needsPhoto = templatesNeedPhoto(selectedTemplates);
  const visibleSteps = STEPS.filter((s) => s.id !== 'image' || needsPhoto);
  const stepIndex = visibleSteps.findIndex((s) => s.id === step);

  const onContentChange = useCallback((patch: Partial<ArtworkContent>) => {
    setContent((c) => ({ ...c, ...patch }));
  }, []);

  const onMoveOffset = useCallback((template: TemplateId, id: string, offset: { x: number; y: number }) => {
    setLayoutOffsets((prev) => ({
      ...prev,
      [template]: { ...(prev[template] ?? {}), [id]: offset },
    }));
  }, []);

  const onToggleLayer = useCallback((template: TemplateId, id: string) => {
    setHiddenLayers((prev) => {
      const forTemplate = { ...(prev[template] ?? {}) };
      forTemplate[id] = !forTemplate[id];
      return { ...prev, [template]: forTemplate };
    });
  }, []);

  const onResizeLayer = useCallback((template: TemplateId, id: string, dh: number) => {
    setLayerSizes((prev) => ({
      ...prev,
      [template]: { ...(prev[template] ?? {}), [id]: dh },
    }));
  }, []);

  const onResetLayout = useCallback((template: TemplateId) => {
    setLayoutOffsets((prev) => {
      const next = { ...prev };
      delete next[template];
      return next;
    });
    setHiddenLayers((prev) => {
      const next = { ...prev };
      delete next[template];
      return next;
    });
    setLayerSizes((prev) => {
      const next = { ...prev };
      delete next[template];
      return next;
    });
  }, []);

  const canNext = () => {
    if (step === 'templates') return selectedTemplates.length > 0;
    if (step === 'image' && needsPhoto) return !!content.photoUrl;
    return true;
  };

  const goNext = () => {
    const next = visibleSteps[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const goBack = () => {
    const prev = visibleSteps[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', 'photo');
      const res = await fetch('/api/social-artwork/library', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setAlbumPhotos((prev) => [data.item, ...prev]);
      onContentChange({ photoUrl: data.item.url });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photo: LibraryItem) => {
    setAlbumPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    if (content.photoUrl === photo.url) onContentChange({ photoUrl: null });
    await fetch(`/api/social-artwork/library?id=${photo.id}`, { method: 'DELETE' });
  };

  const fetchFromUnsplash = async () => {
    const query = unsplashQuery.trim();
    if (!query) return;
    setFetchingUnsplash(true);
    try {
      const res = await fetch('/api/social-artwork/unsplash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, count: unsplashCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unsplash fetch failed');
      const items = (data.items ?? []) as LibraryItem[];
      setAlbumPhotos((prev) => [...items, ...prev]);
      if (items[0]) onContentChange({ photoUrl: items[0].url });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unsplash fetch failed');
    } finally {
      setFetchingUnsplash(false);
    }
  };

  const saveArtworkToAlbum = async (dataUrl: string, filename: string, template: TemplateId, fmt: Format) => {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append('file', new File([blob], filename, { type: 'image/png' }));
      fd.append('kind', 'artwork');
      fd.append('template', template);
      fd.append('format', fmt);
      fd.append('label', filename);
      await fetch('/api/social-artwork/library', { method: 'POST', body: fd });
    } catch {
      // Download already succeeded; album save is best-effort.
    }
  };

  const onExportAll = async () => {
    setExporting(true);
    try {
      const items = selectedTemplates
        .map((t) => ({ template: t, node: exportRefs.current[t] }))
        .filter((x): x is { template: TemplateId; node: HTMLDivElement } => !!x.node);
      await exportAllArtwork(
        items.map((x) => ({ ...x, format })),
        saveArtworkToAlbum,
      );
    } finally {
      setExporting(false);
    }
  };

  const { w, h } = CANVAS[format];

  return (
    <div className="sa-wizard p-4 md:p-6">
      <header className="sa-wizard-header">
        <div className="sa-header-row">
          <div>
            <p className="sa-eyebrow">OMG Experience · Air Freight Forwarding</p>
            <h1>Social Artwork Generator</h1>
            <p className="sa-slogan">Fixed skeleton, flexible content — artwork ready for manual posting.</p>
          </div>
          <Link href="/social-artwork/album" className="sa-album-link">
            Album →
          </Link>
        </div>
      </header>

      <nav className="sa-wizard-steps" aria-label="Progress">
        {visibleSteps.map((s, i) => {
          const active = s.id === step;
          const done = i < stepIndex;
          return (
            <div key={s.id} className={`sa-wizard-step${active ? ' active' : ''}${done ? ' done' : ''}`}>
              <span className="sa-wizard-step-num">{done ? '✓' : i + 1}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </nav>

      <main className="sa-wizard-body">
        {step === 'templates' && (
          <section className="sa-wizard-panel">
            <h2>Choose templates</h2>
            <p className="sa-panel-desc">Select one or more artwork layouts. You can download all at once.</p>
            <TemplatePicker
              selected={selectedTemplates}
              onChange={(ids) => {
                setSelectedTemplates(ids);
                if (ids[0] && ids.length === 1) setContent(defaultContent(ids[0]));
              }}
            />
          </section>
        )}

        {step === 'format' && (
          <section className="sa-wizard-panel">
            <h2>Choose format</h2>
            <p className="sa-panel-desc">Where will you publish these artworks?</p>
            <div className="sa-format-cards">
              <button
                type="button"
                className={`sa-format-card${format === 'post' ? ' active' : ''}`}
                onClick={() => setFormat('post')}
              >
                <strong>Post</strong>
                <span>1080 × 1080</span>
                <small>Facebook & Instagram feed</small>
              </button>
              <button
                type="button"
                className={`sa-format-card${format === 'story' ? ' active' : ''}`}
                onClick={() => setFormat('story')}
              >
                <strong>Story</strong>
                <span>1080 × 1920</span>
                <small>Facebook & Instagram story</small>
              </button>
            </div>
          </section>
        )}

        {step === 'image' && needsPhoto && (
          <section className="sa-wizard-panel">
            <h2>Choose image</h2>
            <p className="sa-panel-desc">
              Fetch from Unsplash, upload your own, or pick from the library — all saved to your album.
            </p>
            <div className="sa-unsplash-row">
              <label className="sa-field sa-unsplash-query">
                <span>Photo style (English keywords)</span>
                <input
                  type="text"
                  placeholder="e.g. air cargo warehouse"
                  value={unsplashQuery}
                  disabled={fetchingUnsplash}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void fetchFromUnsplash();
                  }}
                />
              </label>
              <label className="sa-field sa-unsplash-count">
                <span>Count</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={unsplashCount}
                  disabled={fetchingUnsplash}
                  onChange={(e) => setUnsplashCount(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
              <Button
                type="button"
                className="sa-unsplash-btn"
                disabled={fetchingUnsplash || !unsplashQuery.trim()}
                onClick={() => void fetchFromUnsplash()}
              >
                {fetchingUnsplash ? 'Fetching…' : 'Fetch from Unsplash'}
              </Button>
            </div>
            <p className="sa-hint sa-unsplash-key-hint">
              Need an API key? Sign up at{' '}
              <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer">
                unsplash.com/developers
              </a>
              {' '}→ <strong>New Application</strong> → copy <strong>Access Key</strong> → paste in{' '}
              <code>Tr/.env.local</code> as <code>UNSPLASH_ACCESS_KEY=...</code> then restart the dev server.
            </p>
            <label className="sa-field">
              <span>{uploading ? 'Uploading…' : 'Upload photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPhoto(f);
                  e.target.value = '';
                }}
              />
            </label>
            {albumPhotos.length > 0 && (
              <>
                <h3 className="sa-grid-title">My album</h3>
                <div className="sa-sample-grid">
                  {albumPhotos.map((p) => (
                    <div key={p.id} className={content.photoUrl === p.url ? 'sa-sample active' : 'sa-sample'}>
                      <button
                        type="button"
                        className="sa-sample-select"
                        onClick={() => onContentChange({ photoUrl: p.url })}
                      >
                        <img src={p.url} alt={p.label ?? 'Album photo'} />
                        <span>{p.label}</span>
                      </button>
                      <button
                        type="button"
                        className="sa-sample-delete"
                        aria-label={`Delete ${p.label ?? 'photo'}`}
                        onClick={() => void deletePhoto(p)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            <label className="sa-field">
              <span>Focus X ({content.photoFocusX}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                value={content.photoFocusX}
                onChange={(e) => onContentChange({ photoFocusX: Number(e.target.value) })}
              />
            </label>
            <label className="sa-field">
              <span>Focus Y ({content.photoFocusY}%)</span>
              <input
                type="range"
                min={0}
                max={100}
                value={content.photoFocusY}
                onChange={(e) => onContentChange({ photoFocusY: Number(e.target.value) })}
              />
            </label>
          </section>
        )}

        {step === 'content' && (
          <section className={`sa-wizard-panel sa-wizard-panel-split${designMode ? ' sa-design-mode' : ''}`}>
            <div className={designMode ? 'sa-wizard-form-collapsed' : undefined}>
              <h2>Edit content</h2>
              <p className="sa-panel-desc">Logo settings and text shared across selected templates.</p>
              <ContentForm templates={selectedTemplates} content={content} onChange={onContentChange} />
            </div>
            {selectedTemplates.length > 0 && (
              <div className="sa-wizard-side-preview">
                <PreviewSlider
                  templates={selectedTemplates}
                  content={content}
                  format={format}
                  scale={0.32}
                  designMode={designMode}
                  onDesignModeChange={setDesignMode}
                  layoutOffsets={layoutOffsets}
                  hiddenLayers={hiddenLayers}
                  layerSizes={layerSizes}
                  onMove={onMoveOffset}
                  onToggleLayer={onToggleLayer}
                  onResize={onResizeLayer}
                  onResetLayout={onResetLayout}
                />
              </div>
            )}
          </section>
        )}

        {step === 'download' && (
          <section className="sa-wizard-panel">
            <h2>Review & download</h2>
            <p className="sa-panel-desc">
              {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} ·{' '}
              {format === 'post' ? '1080×1080' : '1080×1920'}
            </p>
            <div className="sa-preview-grid">
              {selectedTemplates.map((t) => (
                <ArtworkPreview
                  key={t}
                  template={t}
                  content={content}
                  format={format}
                  layoutOffsets={layoutOffsets[t] ?? {}}
                  hiddenLayers={hiddenLayers[t] ?? {}}
                  layerSizes={layerSizes[t] ?? {}}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="sa-wizard-footer">
        <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
          Back
        </Button>
        <div className="sa-wizard-footer-right">
          {step === 'download' ? (
            <Button type="button" onClick={onExportAll} disabled={exporting}>
              {exporting
                ? 'Downloading…'
                : `Download ${selectedTemplates.length} PNG${selectedTemplates.length !== 1 ? 's' : ''}`}
            </Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={!canNext()}>
              Continue
            </Button>
          )}
        </div>
      </footer>

      <div className="sa-export-mount" aria-hidden="true">
        {selectedTemplates.map((t) => (
          <div
            key={t}
            ref={(el) => {
              exportRefs.current[t] = el;
            }}
            style={{ width: w, height: h }}
          >
            <ArtworkStage format={format}>
              <DesignProvider
                active={false}
                scale={1}
                offsets={layoutOffsets[t] ?? {}}
                hidden={hiddenLayers[t] ?? {}}
                sizes={layerSizes[t] ?? {}}
                onMove={() => {}}
              >
                <TemplateRenderer template={t} content={content} format={format} />
              </DesignProvider>
            </ArtworkStage>
          </div>
        ))}
      </div>
    </div>
  );
}
