import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Interface for extracted document data
interface ExtractedData {
  consignor_name?: string;
  consignor_address?: string;
  consignee_name?: string;
  consignee_address?: string;
  hs_code?: string;
  permit_number?: string;
  po_number?: string;
  country_of_origin?: string;
  country_of_destination?: string;
  quantity?: string;
  total_value?: string;
  shipping_marks?: string;
  shipped_from?: string;
  shipped_to?: string;
  document_date?: string;
}

// Helper function to download file from URL and convert to base64
async function downloadAndConvertToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Helper function to get MIME type from file extension
function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  return mimeTypes[ext || ''] || 'application/pdf';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { document_ids, quotation_id, user_id } = body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json(
        { error: 'document_ids array is required' },
        { status: 400 }
      );
    }

    if (!quotation_id) {
      return NextResponse.json(
        { error: 'quotation_id is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Use Service Role Key to access settings
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    // Get Gemini API key from settings table
    const { data: settingData } = await supabase
      .from('settings')
      .select('settings_value')
      .eq('user_id', user_id)
      .eq('category', 'ai')
      .eq('settings_key', 'gemini_api_key')
      .single();

    // settings_value can be JSONB or string
    let apiKey = settingData?.settings_value;
    if (typeof apiKey !== 'string') {
      apiKey = (apiKey as Record<string, unknown>)?.value as string || '';
    }
    
    // Fallback to env variable if not in settings
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || '';
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set your API key in Settings > AI Settings.' },
        { status: 500 }
      );
    }

    // Get documents from database
    const { data: documents, error: documentsError } = await supabase
      .from('document_submissions')
      .select('*')
      .in('id', document_ids)
      .eq('quotation_id', quotation_id);

    if (documentsError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 404 }
      );
    }

    // Initialize Google GenAI client
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    // Phase 1: Download files and convert to base64, then extract key fields
    console.log('Phase 1: Downloading files and extracting data...');
    const extractedMap: Record<string, ExtractedData> = {};
    const documentsWithData: Array<{
      id: string;
      name: string;
      type: string;
      base64Data: string;
      mimeType: string;
    }> = [];

    for (const doc of documents) {
      try {
        console.log(`Downloading file: ${doc.file_name}`);
        const base64Data = await downloadAndConvertToBase64(doc.file_url);
        const mimeType = getMimeType(doc.file_name);

        documentsWithData.push({
          id: doc.id,
          name: doc.file_name || doc.document_type,
          type: doc.document_type,
          base64Data,
          mimeType,
        });

        // Extract fields from this document
        // EXACT PROMPT from ai-doc-review-main - DO NOT MODIFY
        const extractPrompt = `Extract the following fields from this document section called "${doc.file_name || doc.document_type}".
Return STRICT JSON only (no prose) with keys (use empty string or null if not present):
{
  "consignor_name": "",
  "consignor_address": "",
  "consignee_name": "",
  "consignee_address": "",
  "hs_code": "",
  "permit_number": "",
  "po_number": "",
  "country_of_origin": "",
  "country_of_destination": "",
  "quantity": "",
  "total_value": "",
  "shipping_marks": "",
  "shipped_from": "",
  "shipped_to": "",
  "document_date": ""
}`;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
        const extraction = await model.generateContent([
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          extractPrompt,
        ]);

        let extracted: ExtractedData = {};
        try {
          const responseText = extraction.response.text();
          extracted = JSON.parse(responseText || '{}') as ExtractedData;
        } catch {
          extracted = {};
        }
        extractedMap[doc.id] = extracted;
        console.log(`Extracted data from ${doc.file_name}`);
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        extractedMap[doc.id] = {};
      }
    }

    // Phase 2: Generate comprehensive cross-document comparison
    // EXACT LOGIC from ai-doc-review-main - DO NOT MODIFY
    console.log('Phase 2: Performing cross-document analysis...');
    
    try {
      // Build list of all documents with their extracted data
      const allDocuments = documentsWithData.map(doc => ({
        id: doc.id,
        node_name: doc.name,
        document_type: doc.type,
        extracted: extractedMap[doc.id] || {}
      }));

      // EXACT PROMPT from ai-doc-review-main - DO NOT MODIFY
      const comparisonPrompt = `You are performing a comprehensive cross-document verification for an export shipment.

ALL DOCUMENTS AND THEIR EXTRACTED DATA:
${JSON.stringify(allDocuments, null, 2)}

YOUR TASK:
Compare all documents and identify discrepancies, missing data, and verifications across the entire document set.

CRITICAL COMPARISONS TO PERFORM:
1. Consignor/Consignee names and addresses - must match across all documents
2. Total values - must match (e.g., Commercial Invoice grand total vs Export Permit total value)
3. Quantities - must match across documents
4. HS Codes, Permit numbers, PO numbers - must be consistent
5. Shipping marks, origin/destination - must align
6. Document dates - check for logical sequence

OUTPUT FORMAT - CRITICAL: You MUST create a separate section for EACH document listed below:
${allDocuments.map(d => `- ${d.node_name}`).join('\n')}

For EACH document above, create a section in this EXACT format:

## ${allDocuments[0]?.node_name || 'Document Name'}

### ❌ Critical Issues - Must Fix
- Use format: "Mismatch: <field> — '<value_in_this_doc>' vs '<value_in_other_doc>' in [Other Document Name]"
- Use format: "Missing: <required field> — not found in this document"
- If none, write "None identified."

### ⚠️ Warnings & Recommendations
- Use format: "Minor inconsistency: <field> — <brief description>"
- Use format: "Verified: <field> — '<value>' consistent across all documents"
- If none, write "None identified."

REPEAT THE ABOVE SECTION FORMAT FOR EACH DOCUMENT.

IMPORTANT RULES:
- You MUST create separate ## sections for ALL ${allDocuments.length} documents
- Each section must start with EXACTLY: ## [Document Name]
- Perform all verifications yourself using the extracted data above
- Do NOT tell the user to cross-check anything
- Be specific about which documents have discrepancies
- Keep bullets SHORT and actionable
- No long paragraphs or prose
- DO NOT combine multiple documents into one section`;

      // Prepare all files for multimodal input
      const contents: Array<{ inlineData: { mimeType: string; data: string } } | string> = [];
      for (const doc of documentsWithData) {
        contents.push({
          inlineData: {
            mimeType: doc.mimeType,
            data: doc.base64Data,
          },
        });
      }
      contents.push(comparisonPrompt);

      // Generate comprehensive review
      console.log('Sending request to Gemini AI...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const response = await model.generateContent(contents);
      const fullFeedback = response.response.text();

      console.log('Full AI Feedback Length:', fullFeedback.length);
      console.log('Full AI Feedback Preview:', fullFeedback.substring(0, 500));

      // Parse the response to extract per-document sections
      const documentSections: Record<string, string> = {};
      
      for (const doc of documentsWithData) {
        // Try to extract the section for this document
        // Escape special regex characters in document name
        const escapedName = doc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Match from ## DocumentName until the next ## DocumentName or end of string
        const regex = new RegExp(`##\\s*(?:\\[)?${escapedName}(?:\\])?[\\s\\S]*?(?=(?:\\n##\\s+(?!#))|$)`, 'i');
        const match = fullFeedback.match(regex);
        
        if (match) {
          documentSections[doc.id] = match[0];
          console.log(`Successfully extracted section for ${doc.name}, length: ${match[0].length}`);
        } else {
          console.log(`Failed to extract section for ${doc.name}, using fallback`);
          // If we can't find a section, create a note
          documentSections[doc.id] = `## ${doc.name}\n\n### ⚠️ Warnings & Recommendations\n- No specific feedback generated for this document in the review.`;
        }
      }

      // Build results array
      const results = documentsWithData.map((doc, index) => ({
        document_id: doc.id,
        document_name: doc.name,
        document_type: doc.type,
        ai_feedback: documentSections[doc.id] || 'No feedback generated for this document.',
        sequence_order: index + 1,
      }));

      console.log('Analysis completed successfully');

      return NextResponse.json({
        success: true,
        full_feedback: fullFeedback,
        results,
        extracted_data: extractedMap,
      });

    } catch (error) {
      console.error('Failed to process cross-document comparison:', error);
      return NextResponse.json(
        { error: 'Failed to process cross-document comparison. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('Error in document comparison:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

