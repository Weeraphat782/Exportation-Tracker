'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface QcScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCANNER_ELEMENT_ID = 'qc-qr-scanner-region';

/**
 * Turn a scanned QR payload into an in-app destination.
 * QR codes encode a full URL (e.g. https://host/qc/scan/<code>); we navigate to
 * that path so the smart /qc/scan route routes lab admins to the work page.
 * Bare codes are also accepted and routed through /qc/scan.
 */
function resolveTarget(decoded: string): string | null {
  const text = decoded.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.pathname.includes('/qc/')) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // Not a URL — fall through and treat as a bare code
  }

  if (/^[A-Za-z0-9_-]+$/.test(text)) {
    return `/qc/scan/${encodeURIComponent(text)}`;
  }

  return null;
}

function waitForElement(id: string, timeoutMs = 3000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const el = document.getElementById(id);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('scanner element not found'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export function QcScanDialog({ open, onOpenChange }: QcScanDialogProps) {
  const router = useRouter();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    handledRef.current = false;
    setError(null);
    setStarting(true);

    let cancelled = false;

    const stop = async () => {
      const scanner = scannerRef.current;
      if (!scanner) return;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
      } catch {
        // ignore teardown errors
      }
      scannerRef.current = null;
    };

    const onSuccess = (decodedText: string) => {
      if (handledRef.current) return;
      const target = resolveTarget(decodedText);
      if (!target) {
        toast.error('Unrecognized QR code');
        return;
      }
      handledRef.current = true;
      toast.success('QR detected — opening…');
      stop().finally(() => {
        onOpenChange(false);
        router.push(target);
      });
    };

    const run = async () => {
      try {
        await waitForElement(SCANNER_ELEMENT_ID);
        if (cancelled) return;

        const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewW: number, viewH: number) => {
              const size = Math.floor(Math.min(viewW, viewH) * 0.75);
              return { width: size, height: size };
            },
          },
          onSuccess,
          undefined
        );

        if (!cancelled) setStarting(false);
      } catch (err: unknown) {
        if (cancelled) return;
        setStarting(false);
        if (err instanceof Error && err.name === 'NotAllowedError') {
          setError('Camera permission denied. Allow camera access and try again.');
        } else if (err instanceof Error && err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Unable to start the camera on this device.');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle>Scan QC QR</DialogTitle>
          <DialogDescription>
            Point the camera at a sample&apos;s QR code to open its request.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full overflow-hidden rounded-lg bg-black aspect-square">
          <div id={SCANNER_ELEMENT_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
          {starting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Starting camera…</span>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
