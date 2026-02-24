import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const dynamic = 'force-dynamic'

// Cloudflare R2 Client Configuration for Server Side
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'documents';

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
  try {
    const body = await request.json();
    const { fileName, contentType, quotationId, companyId, documentType, docTypeId } = body;

    if (!fileName || !contentType || !documentType) {
      return NextResponse.json(
        { error: 'Missing required data: fileName, contentType, and documentType.' },
        { status: 400 }
      )
    }

    // Create a URL-safe filename
    const safeFileName = createSafeFileName(fileName);

    let filePath: string;
    if (documentType === 'template') {
      // For templates, we use a different structure: templates/docTypeId/safeFileName
      filePath = `templates/${docTypeId || 'misc'}/${safeFileName}`;
    } else {
      const parentId = quotationId || companyId;
      if (!parentId) {
        return NextResponse.json(
          { error: 'Missing parent ID (quotationId or companyId) for document upload.' },
          { status: 400 }
        )
      }
      // Create the storage path with the safe filename
      filePath = `documents/${parentId}/${documentType}/${safeFileName}`;
    }

    // Generate a signed URL for uploading directly to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
      ContentType: contentType,
    });

    // Signed URL expires in 15 minutes
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 900 });

    // Return the signed URL, path, and original filename for reference
    return NextResponse.json({
      signedUrl: signedUrl,
      path: filePath, // The actual path in the bucket (with safe filename)
      originalFileName: fileName, // Keep original filename for display purposes
      safeFileName: safeFileName, // The sanitized filename used in storage
      provider: 'r2' // Indicate that this is an R2 upload
    });

  } catch (error) {
    console.error('API Route Error (generate-upload-url):', error)
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
