import { GoogleGenAI } from '@google/genai';
import {
  retryWithBackoff,
  getDocumentTypeDisplayName,
  type ExtractedData,
} from '@/lib/document-comparison-utils';
import {
  CUSTOMER_CHECK_RULE,
  computeRequiredDocStatus,
  formatExtractedFields,
} from '@/lib/customer-check-rule';

export interface DocumentCheckInput {
  id: string;
  file_name: string;
  document_type: string;
  base64Data: string;
  mimeType: string;
}

export interface CustomerDocumentCheckResult {
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
  checks: Array<{
    name: string;
    status: 'PASS' | 'WARNING' | 'FAIL';
    details: string;
    message: string;
  }>;
  extractedByDocument: Array<{
    name: string;
    file_name: string;
    fields: Array<{ label: string; value: string }>;
  }>;
  documents: Array<{
    name: string;
    file_name: string;
    critical_issues: string[];
    warnings: string[];
  }>;
  requiredDocs: Array<{ type: string; name: string; primary: boolean; uploaded: boolean }>;
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

function getVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL || 'gemini-3.1-flash-lite-preview';
}

export class DocumentCheckPipelineError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'DocumentCheckPipelineError';
  }
}

/**
 * Run the customer pre-booking Gemini pipeline on in-memory documents (no storage/DB).
 */
export async function runCustomerDocumentCheckPipeline(
  inputs: DocumentCheckInput[]
): Promise<CustomerDocumentCheckResult> {
  if (inputs.length < 2) {
    throw new DocumentCheckPipelineError(
      'Upload at least 2 of the required documents to run a check.',
      400
    );
  }

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new DocumentCheckPipelineError(
      'Document check is temporarily unavailable. Please contact our team.',
      503
    );
  }

  const rule = CUSTOMER_CHECK_RULE;
  const model = getVisionModel();
  const ai = new GoogleGenAI({ apiKey });

  const documentsWithData = inputs.map((doc) => ({
    id: doc.id,
    name: doc.file_name,
    type: doc.document_type,
    base64Data: doc.base64Data,
    mimeType: doc.mimeType,
  }));

  const requiredDocs = computeRequiredDocStatus(documentsWithData.map((d) => d.type));

  const extractedMap: Record<string, ExtractedData> = {};
  const fieldsTemplate = rule.extraction_fields.reduce((acc: Record<string, string>, f) => {
    acc[f] = '';
    return acc;
  }, {});

  const batchPrompt = `Extract the following fields from these ${documentsWithData.length} documents.
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
  for (const doc of documentsWithData) {
    batchContents.push({ inlineData: { mimeType: doc.mimeType, data: doc.base64Data } });
  }
  batchContents.push({ text: batchPrompt });

  try {
    const batchExtraction = await retryWithBackoff(
      () =>
        ai.models.generateContent({
          model,
          contents: batchContents,
          config: { responseMimeType: 'application/json' },
        }),
      3,
      2000
    );
    const batchText = (batchExtraction as { text?: string })?.text ?? '';
    const batchParsed = JSON.parse(batchText) as {
      results: Array<{ id: string; extracted_data: ExtractedData }>;
    };
    (batchParsed.results || []).forEach((res) => {
      extractedMap[res.id] = res.extracted_data || {};
    });
  } catch (e) {
    console.error('document-check phase 1:', e);
  }

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
    () =>
      ai.models.generateContent({
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
    console.error('document-check phase 2 parse:', e);
    throw new DocumentCheckPipelineError(
      'We could not complete the check right now. Please try again in a moment.',
      502
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

  return {
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
  };
}

export function mapPipelineError(error: unknown): { message: string; status: number } {
  if (error instanceof DocumentCheckPipelineError) {
    return { message: error.message, status: error.status };
  }
  if (error instanceof Error) {
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('PERMISSION_DENIED')) {
      return {
        message: 'Document check is temporarily unavailable. Please contact our team.',
        status: 503,
      };
    }
    if (
      error.message.includes('RESOURCE_EXHAUSTED') ||
      error.message.includes('quota') ||
      error.message.includes('429')
    ) {
      return { message: 'The check service is busy. Please try again in a few minutes.', status: 429 };
    }
    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return {
        message: 'The check timed out. Please try again with fewer or smaller files.',
        status: 408,
      };
    }
    if (
      error.message.includes('INVALID_ARGUMENT') ||
      error.message.includes('no pages') ||
      error.message.includes('Unable to process input')
    ) {
      return {
        message: 'We could not read one or more files. Upload valid PDF or image export documents.',
        status: 400,
      };
    }
    const status = (error as Error & { status?: number }).status;
    if (status === 400) {
      return {
        message: 'We could not read one or more files. Upload valid PDF or image export documents.',
        status: 400,
      };
    }
  }
  return { message: 'We could not complete the check right now. Please try again later.', status: 500 };
}
