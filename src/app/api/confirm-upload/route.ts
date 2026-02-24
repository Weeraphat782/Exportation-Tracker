import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// This route confirms a file upload (done via signed URL) and saves the DB record.
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server configuration error: Supabase client not initialized.' },
      { status: 500 }
    )
  }

  try {
    // Extract details needed for DB record from the request body
    const {
      filePath, // The path where the file was uploaded in storage
      quotationId,
      documentType,
      documentTypeName,
      originalFileName,
      notes,
      companyName,
      provider // Optional: 'supabase' or 'r2'
    } = await request.json()

    // Basic validation
    if (!filePath || !quotationId || !documentType || !documentTypeName || !originalFileName || !companyName) {
      return NextResponse.json(
        { error: 'Missing required data for database record.' },
        { status: 400 }
      )
    }

    // Record the submission in the database
    const { data: dbData, error: dbError } = await supabase
      .from('document_submissions')
      .insert({
        quotation_id: quotationId,
        document_type: documentType,
        document_type_name: documentTypeName,
        file_name: originalFileName, // Always use original filename for display
        original_file_name: originalFileName,
        file_path: filePath,
        file_url: '', // We will generate URL on the fly using getFileUrl helper
        notes: notes || null, // Ensure notes is null if empty/undefined
        company_name: companyName,
        storage_provider: provider || 'r2' // Default to r2 for new uploads if not specified
      }).select('id').single()

    if (dbError) {
      console.error('Supabase DB Insert Error (confirm-upload):', dbError)
      // Log the failure, but don't delete the file as it was uploaded successfully.
      // Consider implementing a cleanup mechanism for orphaned storage files later.
      return NextResponse.json(
        { error: `Database record failed: ${dbError.message}` },
        { status: 500 }
      )
    }

    // ---> START: Update Quotation Status
    // Optionally, update the related quotation status after successful submission
    // (Check if this should happen on every submission or only the first/last one based on your logic)
    if (dbData?.id) { // Check if DB insert was successful
      const { error: updateError } = await supabase
        .from('quotations') // Replace with your actual quotations table name
        .update({ status: 'docs_uploaded' }) // Replace with your desired status
        .eq('id', quotationId); // Match the quotation ID

      if (updateError) {
        // Log the error, but don't fail the whole request as the doc submission was saved
        console.error(`Failed to update quotation ${quotationId} status:`, updateError);
      } else {
        console.log(`Successfully updated quotation ${quotationId} status to docs_uploaded`);
      }
    }
    // ---> END: Update Quotation Status

    // Success
    return NextResponse.json({
      success: true,
      message: 'Upload confirmed and record saved.',
      dbId: dbData?.id // Return the created database record ID
    })

  } catch (error) {
    console.error('API Route Error (confirm-upload):', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
} 