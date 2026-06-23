import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = 'weeraphat.issaraphon1@gmail.com';
const DEFAULT_SENDER = 'onboarding@resend.dev';

function resolveSender() {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_SENDER;
}

async function sendEmailToRecipients({
  to,
  subject,
  html,
  text,
}: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  const recipients = [...new Set(to.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mail] RESEND_API_KEY is missing. Email skipped.');
    return;
  }
  if (recipients.length === 0) {
    console.warn('[mail] No recipients. Email skipped.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: resolveSender(),
      to: recipients,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[mail] Resend error:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('[mail] Failed to send email:', err);
    throw err;
  }
}

/**
 * Send an email to the administrator.
 */
export async function sendAdminNotification({
  subject,
  html,
  text,
}: {
  subject: string;
  html: string;
  text: string;
}) {
  try {
    return await sendEmailToRecipients({
      to: [ADMIN_EMAIL],
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error('[mail] Failed to send admin email:', err);
  }
}

/**
 * Specifically for Contact Form submissions.
 */
export async function sendContactNotification({
  name,
  email,
  company,
  inquiryType,
  message,
}: {
  name: string;
  email: string;
  company?: string | null;
  inquiryType?: string | null;
  message: string;
}) {
  const subject = `New Contact Inquiry from ${name}`;
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Company:</strong> ${company || 'N/A'}</p>
    <p><strong>Inquiry Type:</strong> ${inquiryType || 'N/A'}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-wrap;">${message}</p>
  `;
  const text = `New Contact Inquiry\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || 'N/A'}\nInquiry: ${inquiryType || 'N/A'}\n\nMessage:\n${message}`;

  return sendAdminNotification({ subject, html, text });
}

/**
 * Specifically for Document Uploads.
 */
export async function sendDocumentUploadNotification({
  customerName,
  quotationNo,
  documentTypes,
  fileCount,
  destination,
}: {
  customerName?: string | null;
  quotationNo?: string | null;
  documentTypes: string[];
  fileCount: number;
  destination?: string | null;
}) {
  const subject = `Documents Uploaded: ${customerName || 'Customer'} - ${quotationNo || 'Unknown Quote'}`;
  const html = `
    <h2>New Document Upload Update</h2>
    <p><strong>Customer:</strong> ${customerName || 'N/A'}</p>
    <p><strong>Quotation #:</strong> ${quotationNo || 'N/A'}</p>
    <p><strong>Destination:</strong> ${destination || 'N/A'}</p>
    <p><strong>Files Uploaded:</strong> ${fileCount}</p>
    <p><strong>Document Types:</strong> ${documentTypes.join(', ')}</p>
    <hr />
    <p>Please check the admin dashboard for details.</p>
  `;
  const text = `Documents Uploaded\n\nCustomer: ${customerName || 'N/A'}\nQuotation: ${quotationNo || 'N/A'}\nDestination: ${destination || 'N/A'}\nFiles: ${fileCount}\nTypes: ${documentTypes.join(', ')}`;

  return sendAdminNotification({ subject, html, text });
}

function formatMoney(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Notify assigned lab admins when a customer submits a new QC request.
 */
export async function sendQcRequestNotification({
  to,
  qcCode,
  requestId,
  contactName,
  companyName,
  sampleName,
  templateName,
  estimatedTotal,
  detailUrl,
}: {
  to: string[];
  qcCode: string;
  requestId: string;
  contactName?: string | null;
  companyName?: string | null;
  sampleName?: string | null;
  templateName?: string | null;
  estimatedTotal?: number | null;
  detailUrl: string;
}) {
  const customerLabel =
    companyName?.split('\n')[0]?.trim() ||
    contactName?.trim() ||
    'Customer';

  const subject = `QC Request ใหม่: ${qcCode}`;
  const html = `
    <h2>มี QC Request ใหม่เข้าระบบ</h2>
    <p><strong>QC Code:</strong> ${qcCode}</p>
    <p><strong>ลูกค้า:</strong> ${customerLabel}</p>
    <p><strong>ผู้ติดต่อ:</strong> ${contactName || '—'}</p>
    <p><strong>ตัวอย่าง:</strong> ${sampleName || '—'}</p>
    <p><strong>Template:</strong> ${templateName || '—'}</p>
    <p><strong>ราคาประมาณการ (Net):</strong> ${formatMoney(estimatedTotal)} THB</p>
    <hr />
    <p><a href="${detailUrl}">เปิดรายการในระบบ Lab</a></p>
    <p style="color:#64748b;font-size:12px;">Request ID: ${requestId}</p>
  `;
  const text = [
    'มี QC Request ใหม่เข้าระบบ',
    '',
    `QC Code: ${qcCode}`,
    `ลูกค้า: ${customerLabel}`,
    `ผู้ติดต่อ: ${contactName || '—'}`,
    `ตัวอย่าง: ${sampleName || '—'}`,
    `Template: ${templateName || '—'}`,
    `ราคาประมาณการ (Net): ${formatMoney(estimatedTotal)} THB`,
    '',
    `เปิดรายการ: ${detailUrl}`,
  ].join('\n');

  return sendEmailToRecipients({ to, subject, html, text });
}
