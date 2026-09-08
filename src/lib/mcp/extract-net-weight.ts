import { GoogleGenAI } from '@google/genai';
import { getMimeType, retryWithBackoff } from '@/lib/document-comparison-utils';
import { downloadSubmissionFileBytes } from '@/lib/storage';
import type { DocumentSubmission } from '@/lib/db';

export type PackagingUnit = 'pallet' | 'box' | 'carton';

export interface DocumentWeightExtract {
  net_weight_kg: number | null;
  gross_weight_kg?: number | null;
  packaging_unit?: PackagingUnit | null;
  pieces?: number | null;
  raw?: Record<string, unknown>;
}

function getVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL || 'gemini-3.1-flash-lite-preview';
}

export function normalizePackagingUnit(raw?: string | null): PackagingUnit | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (/pallet/.test(t)) return 'pallet';
  if (/carton/.test(t)) return 'carton';
  if (/box|case|crate/.test(t)) return 'box';
  return null;
}

function parseKg(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePieces(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Read net/gross KG + packaging hints from a CI or packing list via Gemini vision. */
export async function extractWeightFromDocument(
  doc: DocumentSubmission
): Promise<DocumentWeightExtract | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[mcp] GEMINI_API_KEY unset — skipping document weight extraction');
    return null;
  }

  const fileName = doc.original_file_name || doc.file_name || 'document.pdf';
  try {
    const bytes = await downloadSubmissionFileBytes({
      file_path: doc.file_path,
      file_url: doc.file_url,
      storage_provider: doc.storage_provider || 'r2',
    });
    const base64Data = Buffer.from(bytes).toString('base64');
    const mimeType = doc.mime_type || getMimeType(fileName);
    const ai = new GoogleGenAI({ apiKey });
    const model = getVisionModel();

    const prompt = `You are reading an air-freight ${doc.document_type_name || doc.document_type} document.
Extract shipment totals for booking email drafting.
Return STRICT JSON only (no markdown):
{
  "net_weight_kg": <total NET weight in kilograms as a number, or null if not found>,
  "gross_weight_kg": <total GROSS weight in kg if shown separately, else null>,
  "packaging_unit": "<pallet|box|carton|other or empty>",
  "pieces_count": <integer count of pallets/boxes/cartons if stated, else null>
}
Prefer total net weight / total QTY KG / net weight fields. Use gross only if net is absent.`;

    const response = await retryWithBackoff(
      () =>
        ai.models.generateContent({
          model,
          contents: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
          config: { responseMimeType: 'application/json' },
        }),
      2,
      1500
    );

    const text = (response as { text?: string })?.text ?? '';
    const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const net =
      parseKg(parsed.net_weight_kg) ??
      parseKg(parsed.net_weight) ??
      parseKg(parsed.total_net_weight_kg);
    const gross =
      parseKg(parsed.gross_weight_kg) ??
      parseKg(parsed.gross_weight) ??
      parseKg(parsed.total_gross_weight_kg);

    return {
      net_weight_kg: net ?? gross,
      gross_weight_kg: gross,
      packaging_unit: normalizePackagingUnit(String(parsed.packaging_unit || '')),
      pieces: parsePieces(parsed.pieces_count),
      raw: parsed,
    };
  } catch (err) {
    console.error(
      `[mcp] extractWeightFromDocument failed (${doc.document_type}, ${fileName}):`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
