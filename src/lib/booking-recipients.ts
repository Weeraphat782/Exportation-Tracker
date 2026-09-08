export interface BookingRecipients {
  to: string;
  cc: string[];
  from: string;
  recipientName: string;
  senderName: string;
}

const DEFAULT_TO = 'montri@handleinterfreight.com';
const DEFAULT_CC = [
  'consol_ap@handleinterfreight.com',
  'consol_ap2@handleinterfreight.com',
  'airport2@handleinterfreight.com',
  'shivek@omgexp.com',
  'Md@handleinterfreight.com',
  'airport@handleinterfreight.com',
];
const DEFAULT_FROM = 'cargo@omgexp.com';
const DEFAULT_RECIPIENT_NAME = 'Montri';
const DEFAULT_SENDER_NAME = 'Weeraphat';

function parseCc(raw: string | undefined): string[] {
  if (!raw?.trim()) return DEFAULT_CC;
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Env-overridable booking email recipients (MCP never sends — draft only). */
export function getBookingRecipients(): BookingRecipients {
  return {
    to: process.env.BOOKING_EMAIL_TO?.trim() || DEFAULT_TO,
    cc: parseCc(process.env.BOOKING_EMAIL_CC),
    from: process.env.BOOKING_EMAIL_FROM?.trim() || DEFAULT_FROM,
    recipientName: process.env.BOOKING_EMAIL_RECIPIENT_NAME?.trim() || DEFAULT_RECIPIENT_NAME,
    senderName: process.env.BOOKING_EMAIL_SENDER_NAME?.trim() || DEFAULT_SENDER_NAME,
  };
}
