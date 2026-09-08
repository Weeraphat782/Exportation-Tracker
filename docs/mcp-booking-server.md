# OMGEXP MCP Booking Server (v1)

Remote **Streamable HTTP** MCP server hosted inside the Next.js app at `https://cargo.omgexp.com/api/mcp`.

Grok Bot connects over the public internet with a static Bearer token. When a customer submits a quotation, the app POSTs a `quotation.created` payload to your Grok routine webhook URL; when Commercial Invoice or packing list docs arrive later, it POSTs `quotation.docs_uploaded`. The bot then calls MCP tools to fetch details and build a booking email draft (**no mail is sent by MCP**).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_API_TOKEN` | Yes | **We generate** this (random secret). Set on Vercel only. Give the same value to Grok Bot as `Authorization: Bearer <token>` when connecting `https://cargo.omgexp.com/api/mcp`. Grok does **not** generate this. |
| `QUOTATION_WEBHOOK_URL` | Yes (for push) | **From Grok Bot** — routine webhook POST URL. Set on Vercel only. |
| `WEBHOOK_SIGNING_SECRET` | Yes (for push) | **From Grok Bot** — routine “Webhook key” / sender key (usually `crsr_...`). Set on Vercel only. Sent outbound as `Authorization: Bearer <key>`. We do **not** invent this and cannot configure a custom secret back into Grok. |
| `GEMINI_API_KEY` | Yes (for doc net) | Server-side vision read of Commercial Invoice / packing list PDFs in `extract_booking_fields`. |
| `GEMINI_VISION_MODEL` | No | Default `gemini-3.1-flash-lite-preview` |
| `BOOKING_EMAIL_TO` | No | Default `montri@handleinterfreight.com` |
| `BOOKING_EMAIL_CC` | No | Comma-separated CC list |
| `BOOKING_EMAIL_FROM` | No | Default `cargo@omgexp.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side quotation/doc access |
| `NEXT_PUBLIC_SITE_URL` | Yes | Used for Document List URL (`/booking/{token}`) |

**Where to get Grok webhook values:** Grok Bot desktop app → routine trigger card → copy the POST URL and webhook/sender key.

If `QUOTATION_WEBHOOK_URL` or `WEBHOOK_SIGNING_SECRET` is unset, push is skipped (no error). Grok can still poll `list_new_quotations` via MCP.

Run migration: `Tr/migrations/012_add_booking_email_drafted.sql`

## MCP tools

| Tool | Purpose |
|------|---------|
| `list_new_quotations` | Pending quotes (default `pending_approval`), excludes drafted |
| `get_quotation` | Full detail + attachment metadata |
| `get_quotation_documents` | Signed download URLs |
| `extract_booking_fields` | Net weight, packaging, routing + doc URLs; reads CI/PL via Gemini when pallets are 0 |
| `update_quotation_net_weight` | Write net KG to `total_actual_weight` (not chargeable) |
| `create_op_card` | Create/link Opportunity from quotation (idempotent) |
| `build_booking_email_draft` | Subject + body + to/cc (OMG format); auto net from docs |
| `mark_booking_email_drafted` | Idempotent drafted flag |

## Connect Grok Bot (xAI API)

```json
{
  "type": "mcp",
  "server_label": "omgexp_booking",
  "server_url": "https://cargo.omgexp.com/api/mcp",
  "authorization": "Bearer YOUR_MCP_API_TOKEN",
  "require_approval": "never"
}
```

Or **grok.com → Connectors → New Connector → Custom** with the same URL and auth header.

## Connect Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "omgexp-booking": {
      "url": "https://cargo.omgexp.com/api/mcp",
      "headers": {
        "Authorization": "Bearer ${env:MCP_API_TOKEN}"
      }
    }
  }
}
```

## Webhook `quotation.created`

Fired from `POST /api/notify-quote-request` after a customer portal submit (fire-and-forget).

Example payload: [scripts/fixtures/quotation-created-webhook.example.json](../scripts/fixtures/quotation-created-webhook.example.json)

## Webhook `quotation.docs_uploaded`

Fired when **Commercial Invoice** or **Export Packing List** is uploaded:

- `POST /api/confirm-upload` (public upload link + staff internal upload)
- `POST /api/notify-docs-uploaded` (customer portal authenticated uploads)

Fires even if `quotation.created` already ran and booking email was **not** marked drafted yet. Fires when quotation status stays `pending_approval` (docs inserted, status unchanged).

Example payload:

```json
{
  "event": "quotation.docs_uploaded",
  "emitted_at": "2026-09-08T04:00:00.000Z",
  "quotation_id": "uuid",
  "omg_number": "OMG09014",
  "quotation_no": "OMG09014",
  "status": "pending_approval",
  "updated_at": "2026-09-08T03:55:00.000Z",
  "doc_types_added": ["commercial-invoice"],
  "document_list_url": "https://cargo.omgexp.com/booking/{token}"
}
```

### Outbound auth (cargo.omgexp.com → Grok)

No HMAC. The app sends:

- `Authorization: Bearer $WEBHOOK_SIGNING_SECRET` (Grok-provided webhook key)
- `Content-Type: application/json`
- `X-OMG-Event: quotation.created` or `quotation.docs_uploaded`

HTTP status and response body are logged (secrets never logged). Retries once on 5xx/timeout.

Test from your machine (replace URL and key from the Grok routine card):

```bash
curl -X POST "$QUOTATION_WEBHOOK_URL" \
  -H "Authorization: Bearer $WEBHOOK_SIGNING_SECRET" \
  -H "Content-Type: application/json" \
  -H "X-OMG-Event: quotation.docs_uploaded" \
  -d '{"event":"quotation.docs_uploaded","quotation_id":"...","omg_number":"OMG09014","doc_types_added":["commercial-invoice"]}'
```

## Net weight from documents

`extract_booking_fields` and `build_booking_email_draft` resolve net weight in this order:

1. Sum of `quotations.pallets[].weight × quantity` (if > 0)
2. `quotations.total_actual_weight` (if > 0)
3. Gemini read of **Commercial Invoice** total net / QTY KG
4. Gemini read of **Export Packing List**
5. `null` / `unavailable`

**Never** uses `chargeable_weight`, `manual_chargeable_weight`, or volume as net.

Returns separately: `net_weight_kg`, `net_weight_source`, `net_weight_confidence`, optional `net_weight_alternatives` (when CI vs PL disagree > ~5%), and `chargeable_weight` (info only).

Document List URL in the email body is enough — **no file attachments** in MCP or Grok Gmail drafts.

## Packaging (Pallet vs Box)

- Default `packaging_type: "pallet"` — NUMBER OF PIECE renders as `"N Pallets"`.
- Pass `packaging_type: "box"` or `"carton"` + `pieces` to `build_booking_email_draft` for `"N Boxes"` / `"N Cartons"`.
- `extract_booking_fields` exposes `document_packaging` / `document_pieces` hints from CI/PL for Grok to detect true mismatches (UI default pallet vs docs showing boxes).
- **Do not** auto-convert a real pallet booking to boxes; only override when documents clearly show boxes/cartons. No UI packaging-default change.

## Suggested Grok routine flow

1. Receive `quotation.created` or `quotation.docs_uploaded` webhook (or poll `list_new_quotations`)
2. `extract_booking_fields` — net + packaging hints from CI/PL
3. `update_quotation_net_weight` — persist correct net (`source: "commercial-invoice"`)
4. `create_op_card` — create/link Opportunity (idempotent if already exists)
5. `build_booking_email_draft` — optional `packaging_type` / `pieces` if doc mismatch
6. **Grok creates Gmail draft** in cargo@omgexp.com (MCP never sends email; no attachments)
7. `mark_booking_email_drafted` (idempotent)

MCP **never sends email**. Pricing / rates are out of scope (handled by humans).

Fallback: poll `list_new_quotations` if webhook missed.

### Example tool calls

**Update net weight from Commercial Invoice:**

```json
{
  "omg_number": "OMG09014",
  "net_weight_kg": 341.6,
  "source": "commercial-invoice",
  "note": "Total QTY KG from CI page 1"
}
```

**Build draft with box packaging override:**

```json
{
  "omg_number": "OMG09014",
  "packaging_type": "box",
  "pieces": 48
}
```

**Create Op card:**

```json
{
  "omg_number": "OMG09014"
}
```

Second call with same OMG# returns the same `op_card_id` with `"created": false`.

## Local check

```bash
npm run verify:booking-draft
```

## Example tool call (curl smoke test)

MCP uses Streamable HTTP JSON-RPC — use an MCP client (Grok, Cursor, MCP Inspector) rather than raw curl for full handshake.
