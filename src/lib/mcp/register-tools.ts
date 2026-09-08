import { fromJsonSchema, type McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import {
  buildBookingEmailDraft,
  extractBookingFields,
  getQuotationDetail,
  getQuotationDocuments,
  listNewQuotations,
  markBookingEmailDrafted,
} from '@/lib/mcp/booking-service';

const refInputSchema = fromJsonSchema<{ quotation_id?: string; omg_number?: string }>({
  type: 'object',
  properties: {
    quotation_id: { type: 'string', description: 'Quotation UUID' },
    omg_number: { type: 'string', description: 'OMG number, e.g. OMG09014' },
  },
  additionalProperties: false,
});

const listInputSchema = fromJsonSchema<{
  status?: string;
  since?: string;
  exclude_drafted?: boolean;
  limit?: number;
}>({
  type: 'object',
  properties: {
    status: { type: 'string', description: 'Quotation status filter (default pending_approval)' },
    since: { type: 'string', description: 'ISO timestamp lower bound' },
    exclude_drafted: { type: 'boolean' },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
  },
  additionalProperties: false,
});

const markInputSchema = fromJsonSchema<{
  quotation_id?: string;
  omg_number?: string;
  drafted_by?: string;
}>({
  type: 'object',
  properties: {
    quotation_id: { type: 'string', description: 'Quotation UUID' },
    omg_number: { type: 'string', description: 'OMG number, e.g. OMG09014' },
    drafted_by: { type: 'string', description: 'Who drafted (default grok-bot)' },
  },
  additionalProperties: false,
});

// ponytail: advertised schema via fromJsonSchema (SDK AJV); Zod 3 refines in handlers.
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
      inputSchema: listInputSchema,
    },
    async (args) => jsonText(await listNewQuotations(parseOrThrow(listSchema, args)))
  );

  server.registerTool(
    'get_quotation',
    {
      description: 'Full quotation detail + attachment metadata by quotation_id or OMG number.',
      inputSchema: refInputSchema,
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
      inputSchema: refInputSchema,
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
      inputSchema: refInputSchema,
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
      inputSchema: refInputSchema,
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
      inputSchema: markInputSchema,
    },
    async (args) => {
      const parsed = parseOrThrow(markSchema, args);
      return jsonText(await markBookingEmailDrafted(parsed));
    }
  );
}
