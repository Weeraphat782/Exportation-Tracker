import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = 'weeraphat.issaraphon1@gmail.com';
const DEFAULT_SENDER = 'onboarding@resend.dev';

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
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mail] RESEND_API_KEY is missing. Email skipped.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: [ADMIN_EMAIL],
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
