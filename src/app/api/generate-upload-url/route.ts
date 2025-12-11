import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// Function to create a completely safe filename using UUID
function createSafeFileName(originalFileName: string): string {
  // Extract file extension
  const lastDotIndex = originalFileName.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? originalFileName.substring(lastDotIndex) : '';
  
  // Use UUID to create a completely safe filename
  const uuid = randomUUID();
  
  // Create final filename: uuid.ext
  return `${uuid}${extension}`;
}

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
    const bucket = 'documents'

    // Create a URL-safe filename
    const safeFileName = createSafeFileName(fileName);
    
    // Create the storage path with the safe filename
    const filePath = `${quotationId}/${documentType}/${safeFileName}`;

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

    // Return the signed URL, path, and original filename for reference
    return NextResponse.json({ 
      signedUrl: data.signedUrl,
      path: data.path, // The actual path in the bucket (with safe filename)
      token: data.token, // The token is part of the signedUrl
      originalFileName: fileName, // Keep original filename for display purposes
      safeFileName: safeFileName // The sanitized filename used in storage
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