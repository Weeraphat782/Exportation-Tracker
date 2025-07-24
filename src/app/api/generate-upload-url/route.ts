import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
// import { randomUUID } from 'crypto' // Removed as unused

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Server configuration error: Supabase client not initialized.' },
      { status: 500 }
    )
  }

  try {
    const { fileName, contentType, quotationId, documentType } = await request.json()

    if (!fileName || !contentType || !quotationId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required data: fileName, contentType, quotationId, documentType.' },
        { status: 400 }
      )
    }

    // Define the storage bucket
    const bucket = 'documents' // Replace if you use a different bucket

    // Create a unique path (e.g., quotationId/documentType/uuid_filename)
    // Using UUID to prevent potential filename clashes more robustly
    // const uniqueId = randomUUID(); // Removed UUID
    // Simple sanitization: replace non-alphanumeric with underscore
    // const safeOriginalName = fileName.replace(/[^a-zA-Z0-9.]/g, '_'); // Removed simple sanitization
    // const uniqueFileName = `${uniqueId}_${safeOriginalName}` // Removed UUID prefix
    
    // Use original filename directly, relying on Supabase/client encoding
    // WARNING: This increases risk of filename collisions if not handled elsewhere.
    const filePath = `${quotationId}/${documentType}/${fileName}`;

    // Generate a signed URL for uploading
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath)

    if (error) {
      console.error('Supabase Signed URL Generation Error:', error)
      return NextResponse.json(
        { error: `Failed to create signed URL: ${error.message}` },
        { status: 500 }
      )
    }

    // Return the signed URL and the path it corresponds to
    return NextResponse.json({ 
      signedUrl: data.signedUrl,
      path: data.path, // The actual path in the bucket
      token: data.token // The token is part of the signedUrl
    });

  } catch (error) {
    console.error('API Route Error (generate-upload-url):', error)
    // Check if JSON parsing failed
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
} 