'use client';

import { useEffect, useRef, useState } from 'react';
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

export function SignaturePadDialog({
  open,
  onOpenChange,
  defaultCompanyName,
  onConfirm,
  busy = false,
}: SignaturePadDialogProps) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [companyName, setCompanyName] = useState(defaultCompanyName);

  useEffect(() => {
    if (open) {
      setCompanyName(defaultCompanyName);
      sigRef.current?.clear();
    }
  }, [open, defaultCompanyName]);

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
            />
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                className: 'w-full h-[150px] touch-none',
                width: 400,
                height: 150,
              }}
              backgroundColor="rgba(255,255,255,0)"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleClear} disabled={busy}>
            Clear
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Submitting…' : 'Confirm & submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
