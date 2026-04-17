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
import { toast } from 'sonner';

export interface SignaturePadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompanyName: string;
  onConfirm: (dataUrl: string, companyName: string) => void | Promise<void>;
  busy?: boolean;
}

const CANVAS_HEIGHT = 180;

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
  const [canvasWidth, setCanvasWidth] = useState(360);

  // Keep the canvas drawing buffer in sync with the CSS width so touch/mouse
  // coordinates line up on both mobile and desktop.
  const syncCanvasSize = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(240, Math.floor(rect.width));
    setCanvasWidth(width);
  }, []);

  useEffect(() => {
    if (!open) return;
    setCompanyName(defaultCompanyName);
    sigRef.current?.clear();
    // Measure after dialog paints
    const raf = requestAnimationFrame(() => {
      syncCanvasSize();
      sigRef.current?.clear();
    });
    return () => cancelAnimationFrame(raf);
  }, [open, defaultCompanyName, syncCanvasSize]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const handler = () => syncCanvasSize();
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, [open, syncCanvasSize]);

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleConfirm = async () => {
    const canvas = sigRef.current;
    if (!canvas || canvas.isEmpty()) {
      toast.error('Please draw your signature');
      return;
    }
    if (!companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }
    const trimmed =
      typeof canvas.getTrimmedCanvas === 'function'
        ? canvas.getTrimmedCanvas()
        : canvas.getCanvas();
    const dataUrl = trimmed.toDataURL('image/png');
    await onConfirm(dataUrl, companyName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign quotation</DialogTitle>
          <DialogDescription>
            Draw your signature below. This will be stored with your quotation acceptance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

          <div
            ref={wrapperRef}
            className="rounded-md border border-slate-200 bg-white overflow-hidden select-none"
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
                },
              }}
              backgroundColor="rgba(255,255,255,0)"
            />
          </div>
          <p className="text-[11px] text-slate-500 text-center -mt-2">
            Draw using your finger or mouse. Tap Clear to redo.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            {busy ? 'Submitting…' : 'Confirm & submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
