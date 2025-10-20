import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Increase timeout for AI processing (max 300s for Pro plan, 60s for Hobby)
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

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
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { document_ids, quotation_id, user_id, rule_id } = body;

    console.log('Document comparison request:', { 
      document_ids_count: document_ids?.length,
      quotation_id,
      user_id,
      rule_id
    });

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

    if (!rule_id) {
      return NextResponse.json(
        { error: 'rule_id is required' },
        { status: 400 }
      );
    }

    // Use Service Role Key to access settings
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    // Get comparison rule from database
    console.log('🔍 Fetching rule from DB with ID:', rule_id);
    const { data: rule, error: ruleError } = await supabase
      .from('document_comparison_rules')
      .select('*')
      .eq('id', rule_id)
      .single();

    if (ruleError || !rule) {
      console.error('❌ Rule fetch error:', ruleError);
      return NextResponse.json(
        { error: 'Comparison rule not found' },
        { status: 404 }
      );
    }

    console.log('✅ Using rule:', rule.name);
    console.log('📝 Rule ID:', rule.id);
    console.log('📏 Instructions length from DB:', rule.comparison_instructions?.length || 0);
    console.log('📄 Instructions preview (first 300 chars):', rule.comparison_instructions?.substring(0, 300));
    console.log('📄 Instructions end (last 300 chars):', rule.comparison_instructions?.substring(Math.max(0, (rule.comparison_instructions?.length || 0) - 300)));

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

    // Phase 1: Download files and convert to base64, then extract key fields (PARALLEL)
    console.log('Phase 1: Downloading files and extracting data in parallel...');
    console.time('Phase 1');
    
    const extractedMap: Record<string, ExtractedData> = {};
    const documentsWithData: Array<{
      id: string;
      name: string;
      type: string;
      base64Data: string;
      mimeType: string;
    }> = [];

    // Process all documents in parallel for faster processing
    const processPromises = documents.map(async (doc) => {
      try {
        console.log(`Downloading file: ${doc.file_name}`);
        const base64Data = await downloadAndConvertToBase64(doc.file_url);
        const mimeType = getMimeType(doc.file_name);

        const docData = {
          id: doc.id,
          name: doc.file_name || doc.document_type,
          type: doc.document_type,
          base64Data,
          mimeType,
        };

        // Extract fields from this document using rule's extraction fields
        const extractionFields = rule.extraction_fields || [];
        const fieldsTemplate = extractionFields.reduce((acc: Record<string, string>, field: string) => {
          acc[field] = "";
          return acc;
        }, {});
        
        const extractPrompt = `Extract the following fields from this document section called "${doc.file_name || doc.document_type}".
Return STRICT JSON only (no prose) with keys (use empty string or null if not present):
${JSON.stringify(fieldsTemplate, null, 2)}`;

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
        
        console.log(`✓ Extracted data from ${doc.file_name}`);
        return { docData, extracted };
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        return {
          docData: {
            id: doc.id,
            name: doc.file_name || doc.document_type,
            type: doc.document_type,
            base64Data: '',
            mimeType: 'application/pdf',
          },
          extracted: {}
        };
      }
    });

    // Wait for all documents to be processed
    const results = await Promise.all(processPromises);
    
    // Populate arrays from results
    results.forEach(({ docData, extracted }) => {
      if (docData.base64Data) {
        documentsWithData.push(docData);
        extractedMap[docData.id] = extracted;
      }
    });
    
    console.timeEnd('Phase 1');
    console.log(`✓ Processed ${documentsWithData.length} documents`);

    // Phase 2: Generate comprehensive cross-document comparison
    // EXACT LOGIC from ai-doc-review-main - DO NOT MODIFY
    console.log('Phase 2: Performing cross-document analysis...');
    
    // Helper function to convert document_type slug to display name
    function getDocumentTypeDisplayName(slug: string): string {
      const typeMap: Record<string, string> = {
        'commercial-invoice': 'Commercial Invoice',
        'packing-list': 'Packing List',
        'tk-31': 'TK-31 Export Report',
        'tk-32': 'TK-32 Export Permit',
        'import-permit': 'Import Permit',
        'export-permit': 'Export Permit',
        'purchase-order': 'Purchase Order',
        'bill-of-lading': 'Bill of Lading',
        'certificate-of-origin': 'Certificate of Origin',
        'other': 'Other Document'
      };
      return typeMap[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    try {
      // Build list of all documents with their extracted data
      const allDocuments = documentsWithData.map(doc => ({
        id: doc.id,
        file_name: doc.name,
        document_type: getDocumentTypeDisplayName(doc.type), // Use display name
        document_type_slug: doc.type, // Keep slug for reference
        extracted: extractedMap[doc.id] || {}
      }));

      // Use rule's comparison instructions
      // Replace placeholders with actual data - use document_type for section headers
      let comparisonPrompt = rule.comparison_instructions
        .replace(/\{allDocuments\}/g, JSON.stringify(allDocuments, null, 2))
        .replace(/\{documentCount\}/g, allDocuments.length.toString())
        .replace(/\{documentList\}/g, allDocuments.map(d => `- ${d.document_type}`).join('\n'))
        .replace(/\{firstDocumentName\}/g, allDocuments[0]?.document_type || 'Document Name');

      // Add critical checks evaluation if available
      const criticalChecks = rule.critical_checks || [];
      if (criticalChecks.length > 0) {
        comparisonPrompt += `\n\n---\n\nCRITICAL CHECKS EVALUATION:\n\n`;
        comparisonPrompt += `You MUST evaluate each of the following critical checks and provide structured feedback.\n\n`;
        comparisonPrompt += `For EACH check below, you MUST include a dedicated section in your response:\n\n`;
        
        criticalChecks.forEach((check: string, index: number) => {
          comparisonPrompt += `${index + 1}. ${check}\n`;
        });
        
        comparisonPrompt += `\n\nFor each critical check, you MUST create a section like this:\n\n`;
        comparisonPrompt += `### Critical Check: [Check Name]\n`;
        comparisonPrompt += `**Status:** PASS | FAIL | WARNING\n`;
        comparisonPrompt += `**Details:** [Provide specific values from each document]\n`;
        comparisonPrompt += `**Issue:** [If FAIL or WARNING, explain what's wrong]\n\n`;
        comparisonPrompt += `Example:\n`;
        comparisonPrompt += `### Critical Check: Net Weight must match across documents\n`;
        comparisonPrompt += `**Status:** FAIL\n`;
        comparisonPrompt += `**Details:** TK32: 500,000g, Packing List: 471,000g, Invoice: 471,000g\n`;
        comparisonPrompt += `**Issue:** Net weight in Packing List and Invoice (471kg) does not match TK32 (500kg). Discrepancy of 29kg.\n\n`;
      }

      // DEBUG: Log the full prompt being sent to AI
      console.log('=== FULL PROMPT SENT TO AI ===');
      console.log('Prompt length:', comparisonPrompt.length);
      console.log('Critical checks count:', criticalChecks.length);
      console.log('First 2000 characters:', comparisonPrompt.substring(0, 2000));
      console.log('Last 1000 characters:', comparisonPrompt.substring(Math.max(0, comparisonPrompt.length - 1000)));
      console.log('=== END PROMPT ===');

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

      // Extract all ## sections from AI response for debugging
      const allSections = fullFeedback.match(/##\s+[^\n]+/g) || [];
      console.log('All ## sections found in AI response:', allSections);
      console.log('Document types we are looking for:', documentsWithData.map(d => getDocumentTypeDisplayName(d.type)));

      // Parse the response to extract per-document sections BY DOCUMENT TYPE
      const documentSections: Record<string, string> = {};
      
      for (const doc of documentsWithData) {
        // Match by document_type display name (e.g., "Commercial Invoice", "Packing List")
        let match = null;
        const displayType = getDocumentTypeDisplayName(doc.type);
        
        // Strategy 1: Match by display type exactly
        const escapedType = displayType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex1 = new RegExp(`##\\s*(?:\\[)?${escapedType}(?:\\])?[\\s\\S]*?(?=(?:\\n##\\s+(?!#))|$)`, 'i');
        match = fullFeedback.match(regex1);
        
        // Strategy 2: Flexible match - find any section containing the document type
        if (!match) {
          const regex2 = new RegExp(`##\\s*[^\\n]*${escapedType}[^\\n]*[\\s\\S]*?(?=(?:\\n##\\s+(?!#))|$)`, 'i');
          match = fullFeedback.match(regex2);
        }
        
        // Strategy 3: Match by keywords in document type
        if (!match) {
          const keywords = displayType.split(/\s+/).filter(k => k.length > 2);
          if (keywords.length > 0) {
            const keywordPattern = keywords.join('.*');
            const regex3 = new RegExp(`##\\s*[^\\n]*${keywordPattern}[^\\n]*[\\s\\S]*?(?=(?:\\n##\\s+(?!#))|$)`, 'i');
            match = fullFeedback.match(regex3);
          }
        }
        
        if (match) {
          documentSections[doc.id] = match[0];
          console.log(`✓ Successfully extracted section for ${displayType} (${doc.name}), length: ${match[0].length}`);
        } else {
          console.log(`✗ Failed to extract section for ${displayType} (${doc.name}), using fallback`);
          // If we can't find a section, create a note
          documentSections[doc.id] = `## ${displayType}\n\n### ⚠️ Warnings & Recommendations\n- No specific feedback generated for this document type in the review.\n- File: ${doc.name}`;
        }
      }

      // Check if we successfully extracted any sections
      const successfulExtractions = Object.values(documentSections).filter(s => !s.includes('No specific feedback')).length;
      
      // Parse critical checks results (same for both success and fallback)
      const criticalChecksResults = [];
      const criticalCheckPattern = /###\s*Critical Check:\s*([^\n]+)\n\*\*Status:\*\*\s*(PASS|FAIL|WARNING)[^\n]*\n\*\*Details:\*\*\s*([^\n]+)\n\*\*Issue:\*\*\s*([^\n]+)/gi;
      let checkMatch;
      
      while ((checkMatch = criticalCheckPattern.exec(fullFeedback)) !== null) {
        criticalChecksResults.push({
          check_name: checkMatch[1].trim(),
          status: checkMatch[2].trim().toUpperCase(),
          details: checkMatch[3].trim(),
          issue: checkMatch[4].trim(),
        });
      }
      
      console.log('Parsed critical checks:', criticalChecksResults.length);

      // If extraction failed for all documents, use full feedback for first document
      if (successfulExtractions === 0) {
        console.log('⚠️ Failed to extract individual sections. Using full feedback as fallback.');
        const results = documentsWithData.map((doc, index) => ({
          document_id: doc.id,
          document_name: doc.name,
          document_type: doc.type,
          // Show full feedback only for first document, others get empty
          ai_feedback: index === 0 ? fullFeedback : `See full analysis in the first document (${documentsWithData[0].name})`,
          sequence_order: index + 1,
        }));
        
        return NextResponse.json({
          success: true,
          full_feedback: fullFeedback,
          results,
          extracted_data: extractedMap,
          critical_checks_results: criticalChecksResults,
          critical_checks_list: criticalChecks,
        });
      }
      
      // Build results array with extracted sections
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
        critical_checks_results: criticalChecksResults,
        critical_checks_list: criticalChecks,
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

