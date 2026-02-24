import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'

// Cloudflare R2 Client Configuration for Server Side
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || '',
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // Use path-style for R2 compatibility
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'documents';

/**
 * API route to securely delete an object from R2.
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');
        const bucket = searchParams.get('bucket') || R2_BUCKET;

        if (!path) {
            return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
        }

        console.log(`[API - delete-file] Deleting object at path: ${path} from bucket: ${bucket}`);

        const command = new DeleteObjectCommand({
            Bucket: bucket,
            Key: path,
        });

        await r2Client.send(command);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in delete-file API:', error);
        return NextResponse.json(
            { error: 'Failed to delete file from storage' },
            { status: 500 }
        );
    }
}
