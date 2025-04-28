import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic' // Ensure env vars are read at runtime

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server configuration error: Supabase client not initialized.' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const quotationId = formData.get('quotationId') as string | null
    const documentType = formData.get('documentType') as string | null
    const documentTypeName = formData.get('documentTypeName') as string | null
    const notes = formData.get('notes') as string | null

    if (!file || !quotationId || !documentType || !documentTypeName) {
      return NextResponse.json(
        { error: 'Missing required form data.' },
        { status: 400 }
      )
    }

    // Define the storage bucket and path
    const bucket = 'documents' // Replace if you use a different bucket
    // Sanitize filename and create a path (e.g., quotationId/documentType/timestamp_filename)
    // const fileExtension = file.name.split('.').pop() || '' // Removed as unused
    const timestamp = Date.now()
    // Simple sanitization: replace non-alphanumeric with underscore
    const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${safeOriginalName}`
    const filePath = `${quotationId}/${documentType}/${fileName}`

    // 1. Upload to Supabase Storage using server client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false, // Avoid accidental overwrites; use unique names
         metadata: {
            originalFileName: file.name,
            documentType: documentType,
            documentTypeName: documentTypeName,
            notes: notes || '',
        }
      })

    if (uploadError) {
      console.error('Supabase Storage Upload Error:', uploadError)
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 2. Record the submission in the database using server client
    const { error: dbError } = await supabase
      .from('document_submissions') // Replace with your actual table name
      .insert({
        quotation_id: quotationId,
        document_type: documentType,
        document_type_name: documentTypeName,
        file_name: fileName, // Store the generated unique name
        original_file_name: file.name,
        file_path: uploadData.path,
        notes: notes,
        // submitted_by_customer: true, // Optional flag
        // Add any other relevant fields
      })

    if (dbError) {
      console.error('Supabase DB Insert Error:', dbError)
      // Attempt to delete the already uploaded file if DB insert fails
      await supabase.storage.from(bucket).remove([filePath])
      return NextResponse.json(
        { error: `Database record failed: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Success
    return NextResponse.json({ success: true, filePath: uploadData.path })
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
} 