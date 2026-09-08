import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import {
  buildBookingEmailDraft,
  extractBookingFields,
  getQuotationDetail,
  getQuotationDocuments,
  listNewQuotations,
  markBookingEmailDrafted,
} from '@/lib/mcp/booking-service';

// ponytail: MCP server expects Zod 4 schemas; project uses Zod 3 — validate in handlers instead.
const listSchema = z.object({
  status: z.string().optional(),
  since: z.string().optional(),
  exclude_drafted: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const refSchema = z
  .object({
    quotation_id: z.string().uuid().optional(),
    omg_number: z.string().min(1).optional(),
  })
  .refine((a) => a.quotation_id || a.omg_number, 'Provide quotation_id or omg_number');

const markSchema = refSchema.and(
  z.object({ drafted_by: z.string().optional() })
);

function jsonText(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function parseOrThrow<T>(schema: z.ZodType<T>, args: unknown): T {
  const r = schema.safeParse(args);
  if (!r.success) throw new Error(r.error.errors.map((e) => e.message).join('; '));
  return r.data;
}

export function registerBookingTools(server: McpServer): void {
  server.registerTool(
    'list_new_quotations',
    {
      description:
        'List quotations awaiting booking email (default status=pending_approval, excludes already drafted).',
    },
    async (args) => jsonText(await listNewQuotations(parseOrThrow(listSchema, args)))
  );

  server.registerTool(
    'get_quotation',
    {
      description: 'Full quotation detail + attachment metadata by quotation_id or OMG number.',
    },
    async (args) => {
      const ref = parseOrThrow(refSchema, args);
      const detail = await getQuotationDetail(ref);
      if (!detail) return jsonText({ error: 'Quotation not found.' });
      return jsonText(detail);
    }
  );

  server.registerTool(
    'get_quotation_documents',
    {
      description: 'List customer documents with signed download URLs for a quotation.',
    },
    async (args) => {
      const ref = parseOrThrow(refSchema, args);
      const docs = await getQuotationDocuments(ref);
      if (!docs) return jsonText({ error: 'Quotation not found.' });
      return jsonText(docs);
    }
  );

  server.registerTool(
    'extract_booking_fields',
    {
      description:
        'Normalized booking fields for email drafting. Net weight from quotation pallets; packing list / invoice URLs for verification.',
    },
    async (args) => {
      const ref = parseOrThrow(refSchema, args);
      const fields = await extractBookingFields(ref);
      if (!fields) return jsonText({ error: 'Quotation not found.' });
      return jsonText(fields);
    }
  );

  server.registerTool(
    'build_booking_email_draft',
    {
      description:
        'Build booking request email subject + body + to/cc in OMG standard format. Does not send mail.',
    },
    async (args) => {
      const ref = parseOrThrow(refSchema, args);
      const draft = await buildBookingEmailDraft(ref);
      if (!draft) return jsonText({ error: 'Quotation not found.' });
      return jsonText(draft);
    }
  );

  server.registerTool(
    'mark_booking_email_drafted',
    {
      description: 'Mark quotation as drafted (idempotent — safe to retry for same OMG#).',
    },
    async (args) => {
      const parsed = parseOrThrow(markSchema, args);
      return jsonText(await markBookingEmailDrafted(parsed));
    }
  );
}
