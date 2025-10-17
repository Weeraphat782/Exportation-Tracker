import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { GoogleGenAI } from "@google/genai"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    // Get the review session
    const sessionResult = await sql`
      SELECT * FROM review_sessions WHERE id = ${id}
    `

    if (sessionResult.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const session = sessionResult[0]

    // Get template nodes with AI instructions
    const templateNodesResult = await sql`
      SELECT tn.*, dn.name as node_name, dn.description, dn.example_content
      FROM template_nodes tn
      JOIN document_nodes dn ON tn.node_id = dn.id
      WHERE tn.template_id = ${session.template_id}
      ORDER BY tn.sequence_order
    `

    // Get uploaded documents
    const uploadsResult = await sql`
      SELECT * FROM document_uploads
      WHERE session_id = ${id}
    `

    // Get API key from settings
    const apiKeyResult = await sql`
      SELECT value FROM settings WHERE key = 'gemini_api_key'
    `

    const apiKey = apiKeyResult.length > 0 ? apiKeyResult[0].value : process.env.GEMINI_API_KEY

    if (!apiKey) {
      await sql`
        UPDATE review_sessions
        SET status = 'failed'
        WHERE id = ${id}
      `
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 })
    }

    // Atomically move session to processing; if not pending, exit early (prevents duplicates)
    const updated = await sql`
      UPDATE review_sessions
      SET status = 'processing'
      WHERE id = ${id} AND status = 'pending'
      RETURNING id
    `
    if (updated.length === 0) {
      // Someone else already started or finished
      return NextResponse.json({ message: "Already in progress or completed" }, { status: 200 })
    }

    // Initialize Google GenAI client
    const ai = new GoogleGenAI({ apiKey })

    // Phase 1: Extract key fields from each uploaded document
    const extractedMap: Record<string, any> = {}
    for (const templateNode of templateNodesResult) {
      try {
        const upload = uploadsResult.find((u: any) => u.node_id === templateNode.node_id)
        if (!upload) continue

        const extractPrompt = `Extract the following fields from this document section called "${templateNode.node_name}".
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
}`

        const extraction = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { inlineData: { mimeType: 'application/pdf', data: upload.document_data } },
            { text: extractPrompt },
          ],
        })
        let extracted: any = {}
        try {
          extracted = JSON.parse((extraction as any)?.text || '{}')
        } catch {
          extracted = {}
        }
        extractedMap[templateNode.node_id] = extracted
      } catch (e) {
        extractedMap[templateNode.node_id] = {}
      }
    }

    // Phase 2: Generate a single unified cross-document comparison
    try {
      // Build list of all documents with their extracted data
      const allDocuments = templateNodesResult.map((n: any) => ({
        node_id: n.node_id,
        node_name: n.node_name,
        description: n.description,
        example_content: n.example_content,
        ai_instructions: n.ai_instructions,
        extracted: extractedMap[n.node_id] || {}
      }))

      // Build comprehensive cross-document comparison prompt
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
- DO NOT combine multiple documents into one section`

      // Prepare all PDFs for multimodal input
      const contents: any[] = []
      for (const templateNode of templateNodesResult) {
        const upload = uploadsResult.find((u: any) => u.node_id === templateNode.node_id)
        if (upload) {
          contents.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: upload.document_data,
            },
          })
        }
      }
      contents.push({ text: comparisonPrompt })

      // Generate comprehensive review
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
      })
      const fullFeedback = (response as any)?.text ?? ""

      // Log the full feedback for debugging
      console.log('Full AI Feedback Length:', fullFeedback.length)
      console.log('Full AI Feedback Preview:', fullFeedback.substring(0, 500))

      // Parse the response to extract per-document sections
      // Split by document names
      const documentSections: Record<string, string> = {}
      
      for (const templateNode of templateNodesResult) {
        // Try to extract the section for this document
        // Escape special regex characters in node name
        const escapedNodeName = templateNode.node_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        
        // Match from ## DocumentName until the next ## DocumentName or end of string
        // This pattern handles both ## and ### subsections correctly
        const regex = new RegExp(`##\\s*(?:\\[)?${escapedNodeName}(?:\\])?[\\s\\S]*?(?=(?:\\n##\\s+(?!#))|$)`, 'i')
        const match = fullFeedback.match(regex)
        
        if (match) {
          documentSections[templateNode.node_id] = match[0]
          console.log(`Successfully extracted section for ${templateNode.node_name}, length: ${match[0].length}`)
        } else {
          console.log(`Failed to extract section for ${templateNode.node_name}, using fallback`)
          // If we can't find a section, create a note
          documentSections[templateNode.node_id] = `## ${templateNode.node_name}\n\n### ⚠️ Warnings & Recommendations\n- No specific feedback generated for this document in the review.`
        }
      }

      // Store results for each document
      for (const templateNode of templateNodesResult) {
        const feedback = documentSections[templateNode.node_id] || 'No feedback generated for this document.'
        
        await sql`
          INSERT INTO review_results (session_id, node_id, node_name, ai_feedback, sequence_order)
          VALUES (
            ${id},
            ${templateNode.node_id},
            ${templateNode.node_name},
            ${feedback},
            ${templateNode.sequence_order}
          )
        `
      }
    } catch (error) {
      console.error('Failed to process cross-document comparison:', error)
      // Store error feedback for all nodes
      for (const templateNode of templateNodesResult) {
        await sql`
          INSERT INTO review_results (session_id, node_id, node_name, ai_feedback, sequence_order)
          VALUES (
            ${id},
            ${templateNode.node_id},
            ${templateNode.node_name},
            ${'Error processing cross-document comparison. Please try again.'},
            ${templateNode.sequence_order}
          )
        `
      }
    }

    // Skip generating an overall summary to avoid long prose and FK issues

    // Update session status to completed
    await sql`
      UPDATE review_sessions
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to process review:", error)

    await sql`
      UPDATE review_sessions
      SET status = 'failed'
      WHERE id = ${id}
    `

    return NextResponse.json(
      { error: "Failed to process review" },
      { status: 500 }
    )
  }
}


