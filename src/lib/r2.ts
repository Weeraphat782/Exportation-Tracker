import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_PUBLIC_BUCKET_NAME || 'omgexp-public-assets';
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
});

export async function uploadToR2(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string
): Promise<string> {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );

    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl) {
        // If no public URL is set, we return the key so it's saved in DB, 
        // but it won't display correctly until R2_PUBLIC_URL is added to .env
        console.warn('R2_PUBLIC_URL is not set in environment variables.');
        return key;
    }
    return `${publicUrl}/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
    await r2Client.send(
        new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        })
    );
}

export function getR2KeyFromUrl(url: string): string | null {
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl || !url.startsWith(publicUrl)) return null;
    return url.replace(`${publicUrl}/`, '');
}
