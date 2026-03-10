import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const folder = formData.get('folder') as string || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${folder}/${timestamp}_${safeName}`;

        const url = await uploadToR2(key, buffer, file.type);

        return NextResponse.json({ url, key });
    } catch (error: unknown) {
        console.error('Upload error details:', error);
        return NextResponse.json({
            error: 'Upload failed',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
