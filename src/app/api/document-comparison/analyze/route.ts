import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { getFileUrl } from '@/lib/storage';
import {
  checkRateLimit,
  RATE_LIMIT_WINDOW,
  retryWithBackoff,
  downloadAndConvertToBase64,
  getMimeType,
  getDocumentTypeDisplayName,
  type DocumentData,
  type UploadedDocument,
  type ExtractedData,
} from '@/lib/document-comparison-utils';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

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

function formatDocumentSectionFromJson(review: DocumentReviewJson, fileName: string): string {
  const lines: string[] = [`## ${review.document_type}\n`];
  lines.push('### ❌ Critical Issues - Must Fix');
  if (review.critical_issues?.length) {
    review.critical_issues.forEach((i) => lines.push(`- ${i}`));
  } else {
    lines.push('- None identified.');
  }
  lines.push('\n### ⚠️ Warnings & Recommendations');
  const combined = [...(review.warnings || []), ...(review.recommendations || [])];
  if (combined.length) {
    combined.forEach((w) => lines.push(`- ${w}`));
  } else {
    lines.push('- None identified.');
  }
  if (review.feedback?.trim()) {
    lines.push('\n### Summary');
    lines.push(review.feedback);
  }
  if (fileName) {
    lines.push(`\n*File: ${fileName}*`);
  }
  return lines.join('\n');
}

export async function POST(request: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      document_ids,
      quotation_id,
      user_id,
      rule_id,
      analysis_mode = 'quotation',
      documents,
    } = body;

    if (analysis_mode === 'uploaded') {
      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return NextResponse.json({ error: 'documents array is required for uploaded mode' }, { status: 400 });
      }
      if (!quotation_id) {
        return NextResponse.json({ error: 'quotation_id is required for uploaded mode' }, { status: 400 });
      }
    } else if (analysis_mode === 'quotation') {
      if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
        return NextResponse.json({ error: 'document_ids array is required for quotation mode' }, { status: 400 });
      }
      if (!quotation_id) {
        return NextResponse.json({ error: 'quotation_id is required for quotation mode' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid analysis_mode. Must be 'quotation' or 'uploaded'" }, { status: 400 });
    }

    if (!user_id || !rule_id) {
      return NextResponse.json({ error: 'user_id and rule_id are required' }, { status: 400 });
    }

    if (!checkRateLimit(user_id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few seconds before trying again.', retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000) },
        { status: 429, headers: { 'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString() } }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: rule, error: ruleError } = await supabase
      .from('document_comparison_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (ruleError || !rule) {
      return NextResponse.json({ error: 'Comparison rule not found' }, { status: 404 });
    }

    const { data: settingData } = await supabase
      .from('settings')
      .select('settings_value')
      .eq('user_id', user_id)
      .eq('category', 'ai')
      .eq('settings_key', 'gemini_api_key')
      .single();

    let apiKey = settingData?.settings_value;
    if (typeof apiKey !== 'string') {
      apiKey = (apiKey as Record<string, unknown>)?.value as string || '';
    }
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY || '';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set your API key in Settings > AI Settings.' },
        { status: 500 }
      );
    }

    let documentList: DocumentData[];

    if (analysis_mode === 'uploaded') {
      documentList = (documents as UploadedDocument[]).map((doc, index) => ({
        id: doc.id || `uploaded_${index}`,
        file_name: doc.name,
        file_url: `data:${doc.mimeType};base64,${doc.base64Data}`,
        document_type: doc.type || 'other',
        base64Data: doc.base64Data,
        mimeType: doc.mimeType,
      }));
    } else {
      const { data: docs, error: documentsError } = await supabase
        .from('document_submissions')
        .select('*')
        .in('id', document_ids)
        .eq('quotation_id', quotation_id);

      if (documentsError || !docs?.length) {
        return NextResponse.json({ error: 'Failed to fetch documents from database' }, { status: 404 });
      }
      documentList = docs;
    }

    const ai = new GoogleGenAI({ apiKey });
    const extractedMap: Record<string, ExtractedData> = {};
    const documentsWithData: Array<{ id: string; name: string; type: string; base64Data: string; mimeType: string }> = [];

    // Phase 1: Batch Extract fields from all documents
    console.log('Phase 1: Extracting data from documents in batch...');
    const extractionFields = rule.extraction_fields || [];
    const fieldsTemplate = extractionFields.reduce((acc: Record<string, string>, f: string) => {
      acc[f] = '';
      return acc;
    }, {});

    try {
      // Prepare batch prompt
      const batchPrompt = `Extract the following fields from these ${documentList.length} documents.
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

Available fields to extract: ${extractionFields.join(', ')}`;

      // Prepare files for batch request
      const batchContents: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
      
      for (const doc of documentList) {
        let base64Data: string;
        let mimeType: string;

        if (analysis_mode === 'uploaded' && doc.base64Data) {
          base64Data = doc.base64Data;
          mimeType = doc.mimeType || getMimeType(doc.file_name);
        } else {
          let effectiveUrl = doc.file_url;
          if (!effectiveUrl || effectiveUrl === '' || !effectiveUrl.startsWith('http')) {
            effectiveUrl = await getFileUrl(doc.file_path || doc.file_url || '', doc.storage_provider || 'r2', 'documents');
          }
          if (!effectiveUrl) throw new Error(`No URL available for document: ${doc.file_name}`);
          base64Data = await downloadAndConvertToBase64(effectiveUrl);
          mimeType = getMimeType(doc.file_name);
        }

        batchContents.push({ inlineData: { mimeType, data: base64Data } });
        // Track for Phase 2
        documentsWithData.push({ id: doc.id, name: doc.file_name, type: doc.document_type, base64Data, mimeType });
      }

      batchContents.push({ text: batchPrompt });

      const batchExtraction = await retryWithBackoff(
        () => ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: batchContents,
          config: { responseMimeType: 'application/json' },
        }),
        3,
        2000
      );

      const batchText = (batchExtraction as { text?: string })?.text ?? '';
      try {
        const batchParsed = JSON.parse(batchText) as { results: Array<{ id: string; extracted_data: ExtractedData }> };
        (batchParsed.results || []).forEach(res => {
          extractedMap[res.id] = res.extracted_data || {};
        });
      } catch (parseErr) {
        console.error('Batch extraction JSON parse failed:', parseErr);
        // Fallback or retry individual? For now, we continue with empty map
      }
    } catch (batchError) {
      console.error('Phase 1 Batch error:', batchError);
      throw batchError;
    }

    // Phase 2: Cross-document comparison with structured JSON output
    console.log('Phase 2: Performing cross-document analysis...');
    const criticalChecks = rule.critical_checks || [];
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

    if (criticalChecks.length > 0) {
      comparisonPrompt += `\n\n---\n\nCRITICAL CHECKS EVALUATION:\n\n`;
      criticalChecks.forEach((check: string, i: number) => {
        comparisonPrompt += `${i + 1}. ${check}\n`;
      });
    }

    comparisonPrompt += `

OUTPUT FORMAT - CRITICAL: You MUST respond with valid JSON only. No markdown, no code blocks, no extra text.
Use this exact schema:

{
  "document_reviews": [
    {
      "document_id": "<exact document id from the list>",
      "document_type": "<exact document type name from the list: ${allDocuments.map((d) => d.document_type).join(', ')}>",
      "critical_issues": ["<issue 1>", "<issue 2>"],
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
For critical_checks, include one entry for each critical check listed above.`;

    // Only send files that don't have extracted data or if specifically needed for vision checks
    // For now, to be safe but efficient, we send all but with optimized prompt
    const contents: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];
    for (const doc of documentsWithData) {
      contents.push({ inlineData: { mimeType: doc.mimeType, data: doc.base64Data } });
    }
    contents.push({ text: comparisonPrompt });

    const response = await retryWithBackoff(
      () => ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      3,
      3000
    );

    const responseText = (response as { text?: string })?.text ?? '';
    let parsed: Phase2ResponseJson;
    let fullFeedback: string;
    let criticalChecksResults: CriticalCheckJson[];
    let documentSections: Record<string, string>;

    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      parsed = JSON.parse(cleaned) as Phase2ResponseJson;
      criticalChecksResults = parsed.critical_checks || [];

      documentSections = {};
      const reviewsById = new Map((parsed.document_reviews || []).map((r) => [r.document_id || r.document_type, r]));

      for (const doc of documentsWithData) {
        const displayType = getDocumentTypeDisplayName(doc.type);
        const review = reviewsById.get(doc.id) ?? reviewsById.get(displayType);
        
        if (review) {
          documentSections[doc.id] = formatDocumentSectionFromJson(review as DocumentReviewJson, doc.name);
        } else {
          documentSections[doc.id] = `## ${displayType}\n\n### ⚠️ Warnings & Recommendations\n- No specific feedback generated for this document.\n*File: ${doc.name}*`;
        }
      }

      fullFeedback = (parsed.document_reviews || [])
        .map((r) => formatDocumentSectionFromJson(r, ''))
        .join('\n\n');
    } catch (parseError) {
      console.error('JSON parse failed, using raw response as fallback:', parseError);
      fullFeedback = responseText;
      criticalChecksResults = [];
      documentSections = {};
      for (const doc of documentsWithData) {
        documentSections[doc.id] = `## ${getDocumentTypeDisplayName(doc.type)}\n\n${responseText}\n\n*File: ${doc.name}*`;
      }
    }

    const results = documentsWithData.map((doc, index) => ({
      document_id: doc.id,
      document_name: doc.name,
      document_type: doc.type,
      ai_feedback: documentSections[doc.id] || 'No feedback generated.',
      sequence_order: index + 1,
    }));

    // Save to history
    try {
      let oppId = body.opportunity_id;
      if (!oppId && quotation_id) {
        const { data: qData } = await supabase.from('quotations').select('opportunity_id').eq('id', quotation_id).single();
        oppId = qData?.opportunity_id;
      }
      if (oppId) {
        const { data: latestVersion } = await supabase
          .from('document_analysis_history')
          .select('version')
          .eq('quotation_id', quotation_id)
          .order('version', { ascending: false })
          .limit(1)
          .single();
        const nextVersion = (latestVersion?.version || 0) + 1;
        let overallStatus = 'PASS';
        if (criticalChecksResults.some((c) => c.status === 'FAIL')) overallStatus = 'FAIL';
        else if (criticalChecksResults.some((c) => c.status === 'WARNING')) overallStatus = 'WARNING';
        await supabase.from('document_analysis_history').insert({
          quotation_id,
          opportunity_id: oppId,
          rule_id,
          version: nextVersion,
          results,
          critical_checks_results: criticalChecksResults,
          status: overallStatus,
          created_by: user_id,
        });
      }
    } catch (historyError) {
      console.error('⚠️ Failed to save analysis history:', historyError);
    }

    return NextResponse.json({
      success: true,
      full_feedback: fullFeedback,
      results,
      extracted_data: extractedMap,
      critical_checks_results: criticalChecksResults,
      critical_checks_list: criticalChecks,
    });
  } catch (error: unknown) {
    console.error('Error in document comparison:', error);
    let errorMessage = 'Failed to process cross-document comparison. Please try again.';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'AI service authentication failed. Please check your API key configuration.';
        statusCode = 401;
      } else if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota') || error.message.includes('429')) {
        errorMessage = 'AI service quota exceeded. Please try again in a few minutes.';
        statusCode = 429;
      } else if (error.message.includes('INVALID_ARGUMENT')) {
        errorMessage = 'Invalid document data provided. Please ensure all documents are valid.';
        statusCode = 400;
      } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        errorMessage = 'Document analysis timed out. Please try with fewer or smaller files.';
        statusCode = 408;
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
      } else if (error.message.includes('Max retries exceeded')) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
        statusCode = 503;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
