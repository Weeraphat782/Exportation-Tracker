'use client';

import { useState } from 'react';
import {
  Search,
  Loader2,
  Plane,
  MapPin,
  Package,
  Scale,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { AwbTrackingResult } from '@/lib/thai-cargo-tracking';

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver')) return 'text-[#4a9c2d] bg-[#eaf6e0] border-[#4a9c2d]/20';
  if (s.includes('depart') || s.includes('arriv') || s.includes('manifest')) {
    return 'text-[#184878] bg-[#e6eef6] border-[#184878]/20';
  }
  if (s.includes('book')) return 'text-[#5c656e] bg-[var(--paper-muted)] border-[var(--line)]';
  return 'text-[#e0a209] bg-[#fef9e7] border-[#e0a209]/30';
}

export default function AwbTrackingPage() {
  const [prefix, setPrefix] = useState('217');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AwbTrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/track-awb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: prefix.trim(), number: number.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Tracking failed.');
        return;
      }
      setResult(data as AwbTrackingResult);
    } catch {
      setError('Unable to reach tracking service. Please try again.');
      toast.error('Tracking request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AWB Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your THAI Cargo shipment by Air Waybill number.
        </p>
      </div>

      <form
        onSubmit={handleTrack}
        className="bg-white rounded-sm border p-5 space-y-4"
        style={{ borderColor: 'var(--line)' }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-24">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">
              Prefix
            </label>
            <Input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.replace(/\D/g, '').slice(0, 3))}
              placeholder="217"
              inputMode="numeric"
              maxLength={3}
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 block">
              AWB Number
            </label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="12345678"
              inputMode="numeric"
              maxLength={8}
              required
            />
          </div>
          <div className="sm:self-end">
            <button
              type="submit"
              disabled={loading || prefix.length !== 3 || number.length !== 8}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 h-11 rounded-sm text-sm font-semibold text-white bg-[var(--navy-700)] hover:bg-[var(--navy-950)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Track
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400">Example format: 217-12345678 (THAI Cargo prefix 217)</p>
      </form>

      {error && (
        <div className="flex items-start gap-3 rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div
            className="bg-white rounded-sm border p-5"
            style={{ borderColor: 'var(--line)' }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">{result.awb}</h2>
              {result.status && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusTone(result.status)}`}
                >
                  {result.status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {result.origin || '—'} → {result.destination || '—'}
                </span>
              </div>
              {result.flight && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Plane className="w-4 h-4 text-gray-400" />
                  <span>{result.flight}</span>
                </div>
              )}
              {result.pieces && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span>{result.pieces} pcs</span>
                </div>
              )}
              {result.weight && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Scale className="w-4 h-4 text-gray-400" />
                  <span>{result.weight} kg</span>
                </div>
              )}
              {result.lastUpdate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{result.lastUpdate}</span>
                </div>
              )}
              {result.natureOfGoods && (
                <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  <span>{result.natureOfGoods}</span>
                </div>
              )}
            </div>
          </div>

          {result.events.length > 0 && (
            <div
              className="bg-white rounded-sm border overflow-hidden"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="px-5 py-3 border-b text-sm font-semibold text-gray-900" style={{ borderColor: 'var(--line)' }}>
                Shipment Timeline
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {result.events.map((ev, i) => (
                  <div key={`${ev.station}-${ev.date}-${i}`} className="px-5 py-4 flex gap-4">
                    <div className="w-2 shrink-0 flex flex-col items-center pt-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-[var(--navy-700)]' : 'bg-gray-300'}`} />
                      {i < result.events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{ev.status}</span>
                        <span className="text-xs text-gray-400">{ev.station}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {ev.date}
                        {ev.time ? ` ${ev.time}` : ''}
                      </div>
                      {ev.flightDetails && ev.flightDetails !== '-' && (
                        <div className="text-xs text-gray-600">{ev.flightDetails}</div>
                      )}
                      {(ev.pieces || ev.weight) && (
                        <div className="text-xs text-gray-400">
                          {[ev.pieces && `${ev.pieces} pcs`, ev.weight && ev.weight].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
