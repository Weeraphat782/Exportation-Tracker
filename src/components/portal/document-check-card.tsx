'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  Hourglass,
} from 'lucide-react';
import {
  runCustomerDocumentCheck,
  type CustomerDocCheckResponse,
} from '@/lib/customer-db';
import { computeRequiredDocStatus, isRequiredPrebookingType } from '@/lib/customer-check-rule';

type CheckStatus = 'PASS' | 'WARNING' | 'FAIL';

interface DocumentCheckCardProps {
  quotationId: string;
  uploadedTypes: string[];
}

const statusStyles: Record<CheckStatus, { wrap: string; icon: React.ElementType; iconColor: string; label: string }> = {
  PASS: { wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2, iconColor: 'text-emerald-600', label: 'Looks good' },
  WARNING: { wrap: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle, iconColor: 'text-amber-600', label: 'Almost there' },
  FAIL: { wrap: 'bg-red-50 border-red-200 text-red-800', icon: XCircle, iconColor: 'text-red-600', label: 'Needs fixing' },
};

const overallCopy: Record<CheckStatus, { title: string; sub: string }> = {
  PASS: { title: 'Your documents look good', sub: 'No blocking issues were found in the automated pre-check.' },
  WARNING: { title: 'Almost there — a few things to double-check', sub: 'Review the warnings below before our team checks your documents.' },
  FAIL: { title: 'Some documents need fixing', sub: 'Please fix the issues below and run the check again.' },
};

export function DocumentCheckCard({ quotationId, uploadedTypes }: DocumentCheckCardProps) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CustomerDocCheckResponse | null>(null);

  const requiredStatus = useMemo(
    () => (result?.requiredDocs ?? computeRequiredDocStatus(uploadedTypes)),
    [result, uploadedTypes]
  );

  const requiredUploadedCount = useMemo(
    () => uploadedTypes.filter((t) => isRequiredPrebookingType(t)).length,
    [uploadedTypes]
  );

  const canRun = requiredUploadedCount >= 2 && !running;

  const guidance =
    requiredUploadedCount === 0
      ? 'Upload the required pre-booking documents first.'
      : requiredUploadedCount === 1
        ? 'Upload at least 2 of the required documents to run a check.'
        : null;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    const res = await runCustomerDocumentCheck(quotationId);
    if (res.ok) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
    setRunning(false);
  };

  // Warn the customer if they try to leave/refresh while the check is running
  useEffect(() => {
    if (!running) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [running]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#215497]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900">Check your documents</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Run an automated pre-booking check before our team reviews them.
          </p>
        </div>
      </div>

      {/* Required documents checklist */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Documents for this check
        </p>
        <div className="flex flex-wrap gap-2">
          {requiredStatus.map((doc) => (
            <span
              key={doc.type}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                doc.uploaded
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {doc.uploaded ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {doc.name}
              {doc.primary && <span className="opacity-60">(primary)</span>}
            </span>
          ))}
        </div>
        {requiredStatus.some((d) => !d.uploaded) && (
          <p className="text-xs text-amber-700 mt-2">
            Missing documents will be flagged as warnings — you can still run the check.
          </p>
        )}
      </div>

      {/* Action */}
      <div className="mt-5">
        <button
          type="button"
          onClick={handleRun}
          disabled={!canRun}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#215497] text-white text-sm font-semibold hover:bg-[#1a4378] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking your documents…
            </>
          ) : result ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Re-check
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Check my documents
            </>
          )}
        </button>
        {running && (
          <div className="mt-4 flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-lg animate-attention">
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <Hourglass className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Please stay on this page
              </p>
              <p className="text-sm sm:text-base font-semibold text-amber-800 mt-1.5 leading-relaxed">
                Do <span className="underline decoration-2 underline-offset-2">not</span> close, leave, or refresh this page.
                We&apos;re analyzing your documents right now — this can take a little while. The results will appear here automatically when it&apos;s done.
              </p>
            </div>
          </div>
        )}
        {guidance && <p className="text-xs text-gray-500 mt-2">{guidance}</p>}
        {result && !running && (
          <p className="text-xs text-gray-400 mt-2">
            {result.checksRemaining} check{result.checksRemaining === 1 ? '' : 's'} left today
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="mt-5 space-y-4">
          <OverallBanner status={result.overallStatus} />

          {result.checks.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Checks</p>
              <ul className="space-y-2">
                {result.checks.map((c, i) => {
                  const s = statusStyles[c.status] || statusStyles.WARNING;
                  const Icon = s.icon;
                  return (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${s.iconColor}`} />
                      <div className="min-w-0">
                        <span className="font-medium text-gray-800">{c.name}</span>
                        {c.details && (
                          <p className="text-gray-500 mt-0.5 text-xs leading-relaxed">{c.details}</p>
                        )}
                        {c.message && c.status !== 'PASS' && (
                          <p
                            className={`mt-0.5 text-xs leading-relaxed ${
                              c.status === 'FAIL' ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            {c.message}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {result.documents.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                Documents to review
              </p>
              <div className="space-y-3">
                {result.documents.map((doc, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-200 bg-gray-50/60">
                    <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                    <ul className="mt-1.5 space-y-1">
                      {doc.critical_issues.map((issue, j) => (
                        <li key={`c-${j}`} className="flex items-start gap-2 text-sm text-red-700">
                          <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                      {doc.warnings.map((w, j) => (
                        <li key={`w-${j}`} className="flex items-start gap-2 text-sm text-amber-700">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
            This is an automated pre-check. Final approval is done by our team.
          </p>
        </div>
      )}
    </div>
  );
}

function OverallBanner({ status }: { status: CheckStatus }) {
  const s = statusStyles[status] || statusStyles.WARNING;
  const Icon = s.icon;
  const copy = overallCopy[status] || overallCopy.WARNING;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${s.wrap}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.iconColor}`} />
      <div>
        <p className="font-semibold">{copy.title}</p>
        <p className="text-sm mt-0.5 opacity-90">{copy.sub}</p>
      </div>
    </div>
  );
}
