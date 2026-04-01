const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export type TelegramDocumentNotifyPayload = {
  quotationId: string;
  quotationNo?: string | null;
  customerName?: string | null;
  destination?: string | null;
  documentTypes: string[];
  fileCount: number;
};

/**
 * Sends admin Telegram alert when customers upload documents.
 * No-ops if env is missing; never throws (logs errors only).
 */
export async function sendTelegramDocumentUploadNotification(
  payload: TelegramDocumentNotifyPayload
): Promise<void> {
  if (!TELEGRAM_TOKEN || !ADMIN_CHAT_ID) {
    console.warn(
      'TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not set, skipping notification'
    );
    return;
  }

  const {
    quotationId,
    quotationNo,
    customerName,
    destination,
    documentTypes,
    fileCount,
  } = payload;

  const docList =
    documentTypes.length > 0
      ? documentTypes.map((d) => `  • ${d}`).join('\n')
      : '  (ไม่มีรายการ)';

  const text =
    '📄 ลูกค้าส่งเอกสารใหม่!\n\n' +
    `🏢 บริษัท: ${customerName || 'N/A'}\n` +
    `📋 Quote: ${quotationNo || quotationId || 'N/A'}\n` +
    `✈️ ปลายทาง: ${destination || 'N/A'}\n` +
    `📁 ไฟล์ที่อัพ (${fileCount || 0} ไฟล์):\n${docList}`;

  try {
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
  } catch (err) {
    console.error('Telegram notify error:', err);
  }
}
