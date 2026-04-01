import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramDocumentUploadNotification } from '@/lib/telegram-admin-notify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      quotationId,
      quotationNo,
      customerName,
      destination,
      documentTypes,
      fileCount,
    } = body;

    const types = Array.isArray(documentTypes) ? documentTypes : [];
    await sendTelegramDocumentUploadNotification({
      quotationId: String(quotationId ?? ''),
      quotationNo,
      customerName,
      destination,
      documentTypes: types.map(String),
      fileCount: Number(fileCount) || 0,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram notify error:', err);
    return NextResponse.json({ ok: true }); // Don't fail the request
  }
}
