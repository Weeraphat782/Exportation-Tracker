import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { getFileUrl } from '@/lib/storage';
import {
  retryWithBackoff,
  downloadAndConvertToBase64,
  getMimeType,
  getDocumentTypeDisplayName,
  type ExtractedData,
} from '@/lib/document-comparison-utils';
import {
  CUSTOMER_CHECK_RULE,
  computeRequiredDocStatus,
  formatExtractedFields,
  isRequiredPrebookingType,
} from '@/lib/customer-check-rule';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Tunable cost-control defaults for customer self-checks.
const DAILY_CAP = 5;
const COOLDOWN_MS = 60_000;
// TEMP: daily cap disabled for testing. Set back to true to re-enable.
const ENFORCE_DAILY_CAP = false;

function getVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL || 'gemini-3.1-flash-lite-preview';
}

interface DocumentReviewJson {
  document_id?: string;
  document_type: string;
  critical_issues: string[];
  warnings: string[];
  recommendations: string[];
  feedback: string;
}

interface CriticalCheckJson {
  check_name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  issue: string;
}

interface Phase2ResponseJson {
  document_reviews: DocumentReviewJson[];
  critical_checks: CriticalCheckJson[];
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // --- Authenticate the customer from the bearer token ---
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : '';
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const quotationId = typeof body.quotation_id === 'string' ? body.quotation_id.trim() : '';
    if (!quotationId) {
      return NextResponse.json({ error: 'quotation_id is required.' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // --- Ownership: the quotation must belong to this customer ---
    const { data: quotation } = await supabase
      .from('quotations')
      .select('id, customer_user_id')
      .eq('id', quotationId)
      .eq('customer_user_id', user.id)
      .maybeSingle();

    if (!quotation) {
      return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 });
    }

    // --- Rate limiting via document_analysis_history (customer runs only) ---
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRuns } = await supabase
      .from('document_analysis_history')
      .select('created_at')
      .eq('quotation_id', quotationId)
      .eq('created_by', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    const runsToday = recentRuns?.length || 0;
    if (ENFORCE_DAILY_CAP && runsToday >= DAILY_CAP) {
      return NextResponse.json(
        { error: `You have reached the daily limit of ${DAILY_CAP} checks for this shipment. Please try again tomorrow.` },
        { status: 429 }
      );
    }
    if (recentRuns && recentRuns.length > 0) {
      const last = new Date(recentRuns[0].created_at).getTime();
      const elapsed = Date.now() - last;
      if (elapsed < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${wait}s before checking again.`, retryAfter: wait },
          { status: 429 }
        );
      }
    }

    // --- Gather ALL documents for this shipment (no customer selection) ---
    const { data: docs } = await supabase
      .from('document_submissions')
      .select('id, file_name, document_type, file_path, file_url, storage_provider')
      .eq('quotation_id', quotationId);

    const documentList = docs ?? [];
    const requiredDocs = computeRequiredDocStatus(documentList.map((d) => d.document_type));
    const analyzeDocs = documentList.filter((d) => isRequiredPrebookingType(d.document_type));

    if (analyzeDocs.length === 0) {
      return NextResponse.json(
        { error: 'Upload the required pre-booking documents first.', requiredDocs },
        { status: 400 }
      );
    }
    if (analyzeDocs.length < 2) {
      return NextResponse.json(
        { error: 'Upload at least 2 of the required documents to run a check.', requiredDocs },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Document check is temporarily unavailable. Please contact our team.' },
        { status: 503 }
      );
    }

    const rule = CUSTOMER_CHECK_RULE;
    const model = getVisionModel();
    const ai = new GoogleGenAI({ apiKey });

    // --- Phase 1: extract fields from every document (with images for vision) ---
    const extractedMap: Record<string, ExtractedData> = {};
    const documentsWithData: Array<{ id: string; name: string; type: string; base64Data: string; mimeType: string }> = [];

    const fieldsTemplate = rule.extraction_fields.reduce((acc: Record<string, string>, f) => {
      acc[f] = '';
      return acc;
    }, {});

    const batchPrompt = `Extract the following fields from these ${analyzeDocs.length} documents.
For each document, provide the extracted data based on its content.
Return STRICT JSON only (no prose) in this format:
{
  "results": [
    {
      "id": "<document_id>",
      "extracted_data": ${JSON.stringify(fieldsTemplate)}
    }
  ]
}

Available fields to extract: ${rule.extraction_fields.join(', ')}`;

    const batchContents: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
    for (const doc of analyzeDocs) {
      let effectiveUrl = doc.file_url;
      if (!effectiveUrl || !effectiveUrl.startsWith('http')) {
        effectiveUrl = await getFileUrl(doc.file_path || doc.file_url || '', doc.storage_provider || 'r2', 'documents');
      }
      if (!effectiveUrl) continue;
      const base64Data = await downloadAndConvertToBase64(effectiveUrl);
      const mimeType = getMimeType(doc.file_name);
      batchContents.push({ inlineData: { mimeType, data: base64Data } });
      documentsWithData.push({ id: doc.id, name: doc.file_name, type: doc.document_type, base64Data, mimeType });
    }

    if (documentsWithData.length < 2) {
      return NextResponse.json(
        { error: 'We could not read enough of your documents. Please re-upload them and try again.', requiredDocs },
        { status: 400 }
      );
    }

    batchContents.push({ text: batchPrompt });

    try {
      const batchExtraction = await retryWithBackoff(
        () => ai.models.generateContent({
          model,
          contents: batchContents,
          config: { responseMimeType: 'application/json' },
        }),
        3,
        2000
      );
      const batchText = (batchExtraction as { text?: string })?.text ?? '';
      const batchParsed = JSON.parse(batchText) as { results: Array<{ id: string; extracted_data: ExtractedData }> };
      (batchParsed.results || []).forEach((res) => {
        extractedMap[res.id] = res.extracted_data || {};
      });
    } catch (e) {
      console.error('portal document-check phase 1:', e);
      // Continue with empty extraction map; phase 2 still has the images.
    }

    // --- Phase 2: cross-document comparison (structured JSON) ---
    const allDocuments = documentsWithData.map((doc) => ({
      id: doc.id,
      file_name: doc.name,
      document_type: getDocumentTypeDisplayName(doc.type),
      document_type_slug: doc.type,
      extracted: extractedMap[doc.id] || {},
    }));

    let comparisonPrompt = rule.comparison_instructions
      .replace(/\{allDocuments\}/g, JSON.stringify(allDocuments, null, 2))
      .replace(/\{documentCount\}/g, allDocuments.length.toString())
      .replace(/\{documentList\}/g, allDocuments.map((d) => `- ${d.document_type}`).join('\n'))
      .replace(/\{firstDocumentName\}/g, allDocuments[0]?.document_type || 'Document Name');

    comparisonPrompt += `\n\nDOCUMENTS PROVIDED:\n${JSON.stringify(allDocuments, null, 2)}`;

    comparisonPrompt += `\n\n---\n\nCRITICAL CHECKS EVALUATION:\n\n`;
    rule.critical_checks.forEach((check, i) => {
      comparisonPrompt += `${i + 1}. ${check}\n`;
    });

    comparisonPrompt += `

OUTPUT FORMAT - CRITICAL: You MUST respond with valid JSON only. No markdown, no code blocks, no extra text.
Use this exact schema:

{
  "document_reviews": [
    {
      "document_id": "<exact document id from the list>",
      "document_type": "<exact document type name from the list: ${allDocuments.map((d) => d.document_type).join(', ')}>",
      "critical_issues": ["<issue 1>"],
      "warnings": ["<warning 1>"],
      "recommendations": ["<recommendation 1>"],
      "feedback": "<brief summary for this document>"
    }
  ],
  "critical_checks": [
    {
      "check_name": "<check name>",
      "status": "PASS" | "FAIL" | "WARNING",
      "details": "<specific values from documents>",
      "issue": "<explanation if FAIL or WARNING>"
    }
  ]
}

You MUST include exactly one document_reviews entry for EACH document in this order: ${allDocuments.map((d) => d.document_type).join(', ')}.
For critical_checks, include one entry for each critical check listed above (in order).`;

    const contents: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
    for (const doc of documentsWithData) {
      contents.push({ inlineData: { mimeType: doc.mimeType, data: doc.base64Data } });
    }
    contents.push({ text: comparisonPrompt });

    const response = await retryWithBackoff(
      () => ai.models.generateContent({
        model,
        contents,
        config: { responseMimeType: 'application/json' },
      }),
      3,
      3000
    );

    const responseText = (response as { text?: string })?.text ?? '';
    let parsed: Phase2ResponseJson;
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned) as Phase2ResponseJson;
    } catch (e) {
      console.error('portal document-check phase 2 parse:', e);
      return NextResponse.json(
        { error: 'We could not complete the check right now. Please try again in a moment.' },
        { status: 502 }
      );
    }

    const criticalChecksResults = parsed.critical_checks || [];
    const reviewsById = new Map(
      (parsed.document_reviews || []).map((r) => [r.document_id || r.document_type, r])
    );

    let overallStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (criticalChecksResults.some((c) => c.status === 'FAIL')) overallStatus = 'FAIL';
    else if (criticalChecksResults.some((c) => c.status === 'WARNING')) overallStatus = 'WARNING';

    const extractedByDocument = documentsWithData.map((doc) => ({
      name: getDocumentTypeDisplayName(doc.type),
      file_name: doc.name,
      fields: formatExtractedFields(extractedMap[doc.id] as Record<string, unknown>),
    }));

    // Per-document issues for the customer (only docs that have something to fix).
    const documentIssues = documentsWithData
      .map((doc) => {
        const displayType = getDocumentTypeDisplayName(doc.type);
        const review = reviewsById.get(doc.id) ?? reviewsById.get(displayType);
        const critical = review?.critical_issues?.filter(Boolean) || [];
        const warnings = review?.warnings?.filter(Boolean) || [];
        return {
          name: displayType,
          file_name: doc.name,
          critical_issues: critical,
          warnings,
        };
      })
      .filter((d) => d.critical_issues.length > 0 || d.warnings.length > 0);

    // Persist for staff visibility + rate-limit accounting (best effort).
    try {
      const { data: latest } = await supabase
        .from('document_analysis_history')
        .select('version')
        .eq('quotation_id', quotationId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextVersion = (latest?.version || 0) + 1;
      const results = documentsWithData.map((doc, index) => {
        const displayType = getDocumentTypeDisplayName(doc.type);
        const review = reviewsById.get(doc.id) ?? reviewsById.get(displayType);
        return {
          document_id: doc.id,
          document_name: doc.name,
          document_type: doc.type,
          ai_feedback: review?.feedback || '',
          sequence_order: index + 1,
        };
      });
      await supabase.from('document_analysis_history').insert({
        quotation_id: quotationId,
        rule_id: null,
        version: nextVersion,
        results,
        critical_checks_results: criticalChecksResults,
        status: overallStatus,
        created_by: user.id,
      });
    } catch (e) {
      console.error('portal document-check history insert:', e);
    }

    return NextResponse.json({
      success: true,
      overallStatus,
      checks: criticalChecksResults.map((c) => ({
        name: c.check_name,
        status: c.status,
        details: c.details || '',
        message: c.issue || '',
      })),
      extractedByDocument,
      documents: documentIssues,
      requiredDocs,
      checksRemaining: Math.max(0, DAILY_CAP - (runsToday + 1)),
      checkedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('portal document-check error:', error);
    let message = 'We could not complete the check right now. Please try again later.';
    let status = 500;
    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('PERMISSION_DENIED')) {
        message = 'Document check is temporarily unavailable. Please contact our team.';
        status = 503;
      } else if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota') || error.message.includes('429')) {
        message = 'The check service is busy. Please try again in a few minutes.';
        status = 429;
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        message = 'The check timed out. Please try again with fewer or smaller files.';
        status = 408;
      }
    }
    return NextResponse.json({ error: message }, { status });
  }
}
