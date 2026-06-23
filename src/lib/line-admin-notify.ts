const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_QC_GROUP_ID = process.env.LINE_QC_GROUP_ID?.trim();

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export type LineQcNotifyPayload = {
  qcCode: string;
  requestId: string;
  contactName?: string | null;
  companyName?: string | null;
  sampleName?: string | null;
  templateName?: string | null;
  estimatedTotal?: number | null;
  detailUrl: string;
};

export type LineNotifyResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'api_error'; detail?: string };

/**
 * Push QC request alert to the configured LINE group.
 * No-ops when env is missing; never throws.
 */
export async function sendQcRequestToLineGroup(
  payload: LineQcNotifyPayload
): Promise<LineNotifyResult> {
  if (!LINE_CHANNEL_ACCESS_TOKEN || !LINE_QC_GROUP_ID) {
    console.warn(
      '[line] LINE_CHANNEL_ACCESS_TOKEN or LINE_QC_GROUP_ID not set, skipping QC notification'
    );
    return { ok: false, reason: 'not_configured' };
  }

  const customerLabel =
    payload.companyName?.split('\n')[0]?.trim() ||
    payload.contactName?.trim() ||
    'Customer';

  const text = [
    '🔬 มี QC Request ใหม่เข้าระบบ',
    '',
    `QC Code: ${payload.qcCode}`,
    `ลูกค้า: ${customerLabel}`,
    `ผู้ติดต่อ: ${payload.contactName?.trim() || '—'}`,
    `ตัวอย่าง: ${payload.sampleName?.trim() || '—'}`,
    `Template: ${payload.templateName?.trim() || '—'}`,
    `ราคาประมาณการ (Net): ${formatMoney(payload.estimatedTotal)} THB`,
    '',
    `เปิดรายการ: ${payload.detailUrl}`,
  ].join('\n');

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: LINE_QC_GROUP_ID,
        messages: [{ type: 'text', text }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[line] QC group push failed:', detail);
      return { ok: false, reason: 'api_error', detail };
    }

    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[line] QC group push error:', detail);
    return { ok: false, reason: 'api_error', detail };
  }
}
