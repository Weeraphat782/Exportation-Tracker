import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_TOKEN || !ADMIN_CHAT_ID) {
      console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set, skipping notification');
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    const {
      quotationId,
      quotationNo,
      customerName,
      destination,
      documentTypes,
      fileCount,
    } = body;

    const docList =
      Array.isArray(documentTypes) && documentTypes.length > 0
        ? documentTypes.map((d: string) => `  • ${d}`).join('\n')
        : '  (ไม่มีรายการ)';

    const text =
      '📄 ลูกค้าส่งเอกสารใหม่!\n\n' +
      `🏢 บริษัท: ${customerName || 'N/A'}\n` +
      `📋 Quote: ${quotationNo || quotationId || 'N/A'}\n` +
      `✈️ ปลายทาง: ${destination || 'N/A'}\n` +
      `📁 ไฟล์ที่อัพ (${fileCount || 0} ไฟล์):\n${docList}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Telegram notify failed:', err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram notify error:', err);
    return NextResponse.json({ ok: true }); // Don't fail the request
  }
}
