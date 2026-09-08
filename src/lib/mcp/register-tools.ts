import { fromJsonSchema, type McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import {
  buildBookingEmailDraft,
  createOpCard,
  extractBookingFields,
  getQuotationDetail,
  getQuotationDocuments,
  listNewQuotations,
  markBookingEmailDrafted,
  updateQuotationNetWeight,
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

const buildInputSchema = fromJsonSchema<{
  quotation_id?: string;
  omg_number?: string;
  net_weight_kg?: number;
  routing?: string;
  airline?: string;
  preferred_shipment_date?: string;
  mawb?: string;
  consignee?: string;
  number_of_pieces?: string;
  pallet_dimensions?: string;
  origin?: string;
  product?: string;
  destination?: string;
}>({
  type: 'object',
  properties: {
    quotation_id: { type: 'string', description: 'Quotation UUID' },
    omg_number: { type: 'string', description: 'OMG number, e.g. OMG09014' },
    net_weight_kg: {
      type: 'number',
      description: 'Net weight KG from Commercial Invoice (override when pallets are 0)',
    },
    routing: { type: 'string', description: 'Routing e.g. BKK-ZRH' },
    airline: { type: 'string' },
    preferred_shipment_date: { type: 'string' },
    mawb: { type: 'string' },
    consignee: { type: 'string' },
    number_of_pieces: { type: 'string' },
    pallet_dimensions: { type: 'string' },
    origin: { type: 'string', description: 'Origin airport code e.g. BKK' },
    product: { type: 'string' },
    destination: { type: 'string' },
  },
  additionalProperties: false,
});

const updateNetInputSchema = fromJsonSchema<{
  quotation_id?: string;
  omg_number?: string;
  net_weight_kg: number;
  source: string;
  note?: string;
}>({
  type: 'object',
  properties: {
    quotation_id: { type: 'string', description: 'Quotation UUID' },
    omg_number: { type: 'string', description: 'OMG number, e.g. OMG09014' },
    net_weight_kg: { type: 'number', description: 'Correct net weight in KG (writes total_actual_weight)' },
    source: {
      type: 'string',
      description: 'Provenance e.g. commercial-invoice, packing-list, manual',
    },
    note: { type: 'string', description: 'Optional audit note appended to internal_remark' },
  },
  required: ['net_weight_kg', 'source'],
  additionalProperties: false,
});

const opCardInputSchema = fromJsonSchema<{
  quotation_id?: string;
  omg_number?: string;
  topic?: string;
  stage?: string;
  notes?: string;
}>({
  type: 'object',
  properties: {
    quotation_id: { type: 'string', description: 'Quotation UUID' },
    omg_number: { type: 'string', description: 'OMG number, e.g. OMG09014' },
    topic: { type: 'string', description: 'Override opportunity topic (default quotation_no or company)' },
    stage: { type: 'string', description: 'Override stage (default inquiry)' },
    notes: { type: 'string', description: 'Override opportunity notes' },
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

const buildSchema = refSchema.and(
  z.object({
    net_weight_kg: z.number().positive().optional(),
    routing: z.string().min(1).optional(),
    airline: z.string().optional(),
    preferred_shipment_date: z.string().optional(),
    mawb: z.string().optional(),
    consignee: z.string().optional(),
    number_of_pieces: z.string().optional(),
    pallet_dimensions: z.string().optional(),
    origin: z.string().optional(),
    product: z.string().optional(),
    destination: z.string().optional(),
  })
);

const updateNetSchema = refSchema.and(
  z.object({
    net_weight_kg: z.number().positive(),
    source: z.string().min(1),
    note: z.string().optional(),
  })
);

const opCardSchema = refSchema.and(
  z.object({
    topic: z.string().optional(),
    stage: z.string().optional(),
    notes: z.string().optional(),
  })
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
        'Build booking request email subject + body + to/cc in OMG standard format. Does not send mail. Pass net_weight_kg from Commercial Invoice when pallet weights are 0.',
      inputSchema: buildInputSchema,
    },
    async (args) => {
      const parsed = parseOrThrow(buildSchema, args);
      const draft = await buildBookingEmailDraft(parsed);
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

  server.registerTool(
    'update_quotation_net_weight',
    {
      description:
        'Write correct net weight to quotation total_actual_weight (not chargeable). Idempotent re-set is ok.',
      inputSchema: updateNetInputSchema,
    },
    async (args) => jsonText(await updateQuotationNetWeight(parseOrThrow(updateNetSchema, args)))
  );

  server.registerTool(
    'create_op_card',
    {
      description:
        'Create Opportunity / Op card from quotation (same as UI New Opportunity). Returns existing if already linked.',
      inputSchema: opCardInputSchema,
    },
    async (args) => jsonText(await createOpCard(parseOrThrow(opCardSchema, args)))
  );
}
