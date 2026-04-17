'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface SignaturePadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompanyName: string;
  onConfirm: (dataUrl: string, companyName: string) => void | Promise<void>;
  busy?: boolean;
}

const CANVAS_HEIGHT = 200;

export function SignaturePadDialog({
  open,
  onOpenChange,
  defaultCompanyName,
  onConfirm,
  busy = false,
}: SignaturePadDialogProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [canvasWidth, setCanvasWidth] = useState(320);
  const [hasStroke, setHasStroke] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncCanvasSize = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(240, Math.floor(rect.width));
    setCanvasWidth((prev) => (prev === width ? prev : width));
  }, []);

  useEffect(() => {
    if (!open) return;
    setCompanyName(defaultCompanyName);
    setHasStroke(false);
    setError(null);
    sigRef.current?.clear();
    const raf = requestAnimationFrame(() => {
      syncCanvasSize();
      sigRef.current?.clear();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, defaultCompanyName, syncCanvasSize]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => syncCanvasSize());
    ro.observe(el);
    const handler = () => syncCanvasSize();
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, [open, syncCanvasSize]);

  const handleClear = () => {
    sigRef.current?.clear();
    setHasStroke(false);
    setError(null);
  };

  const handleConfirm = async () => {
    setError(null);
    const canvas = sigRef.current;
    if (!canvas || canvas.isEmpty()) {
      setError('Please draw your signature above');
      return;
    }
    if (!companyName.trim()) {
      setError('Please enter your company name');
      return;
    }
    try {
      const trimmed =
        typeof canvas.getTrimmedCanvas === 'function'
          ? canvas.getTrimmedCanvas()
          : canvas.getCanvas();
      const dataUrl = trimmed.toDataURL('image/png');
      await onConfirm(dataUrl, companyName.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Sign quotation</DialogTitle>
          <DialogDescription>
            Draw your signature below. This will be stored with your quotation acceptance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="sign-company">Company name</Label>
            <Input
              id="sign-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              disabled={busy}
              autoComplete="organization"
            />
          </div>

          <div className="space-y-1">
            <Label>Your signature</Label>
            <div
              ref={wrapperRef}
              className="w-full rounded-md border border-slate-300 bg-white overflow-hidden select-none"
              style={{ touchAction: 'none' }}
            >
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  width: canvasWidth,
                  height: CANVAS_HEIGHT,
                  className: 'block touch-none select-none',
                  style: {
                    width: `${canvasWidth}px`,
                    height: `${CANVAS_HEIGHT}px`,
                    touchAction: 'none',
                    display: 'block',
                  },
                }}
                backgroundColor="rgba(255,255,255,0)"
                onBegin={() => {
                  setHasStroke(true);
                  setError(null);
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              {hasStroke
                ? 'Signature captured. Tap Clear to redo.'
                : 'Draw using your finger or mouse.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleClear}
            disabled={busy}
            className="w-full sm:w-auto sm:h-10"
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="w-full sm:w-auto sm:h-10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleConfirm}
            disabled={busy}
            className="w-full sm:w-auto sm:h-10"
          >
            {busy ? 'Submitting…' : 'Confirm & submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
