# OMGEXP MCP Booking Server (v1)

Remote **Streamable HTTP** MCP server hosted inside the Next.js app at `https://cargo.omgexp.com/api/mcp`.

Grok Bot connects over the public internet with a static Bearer token. When a customer submits a quotation, the app POSTs a `quotation.created` payload to your Grok routine webhook URL; the bot then calls MCP tools to fetch details and build a booking email draft (**no mail is sent by MCP**).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_API_TOKEN` | Yes | **We generate** this (random secret). Set on Vercel only. Give the same value to Grok Bot as `Authorization: Bearer <token>` when connecting `https://cargo.omgexp.com/api/mcp`. Grok does **not** generate this. |
| `QUOTATION_WEBHOOK_URL` | Yes (for push) | **From Grok Bot** — routine webhook POST URL. Set on Vercel only. |
| `WEBHOOK_SIGNING_SECRET` | Yes (for push) | **From Grok Bot** — routine “Webhook key” / sender key (usually `crsr_...`). Set on Vercel only. Sent outbound as `Authorization: Bearer <key>`. We do **not** invent this and cannot configure a custom secret back into Grok. |
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
| `extract_booking_fields` | Normalized fields + doc URLs to verify net weight |
| `build_booking_email_draft` | Subject + body + to/cc (OMG format) |
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

### Outbound auth (cargo.omgexp.com → Grok)

No HMAC. The app sends:

- `Authorization: Bearer $WEBHOOK_SIGNING_SECRET` (Grok-provided webhook key)
- `Content-Type: application/json`
- `X-OMG-Event: quotation.created`

Test from your machine (replace URL and key from the Grok routine card):

```bash
curl -X POST "$QUOTATION_WEBHOOK_URL" \
  -H "Authorization: Bearer $WEBHOOK_SIGNING_SECRET" \
  -H "Content-Type: application/json" \
  -H "X-OMG-Event: quotation.created" \
  -d @scripts/fixtures/quotation-created-webhook.example.json
```

## Suggested Grok routine flow

1. Receive `quotation.created` webhook
2. `get_quotation` or `extract_booking_fields` (verify net weight from packing list URLs if needed)
3. `build_booking_email_draft`
4. Present draft to staff / copy to clipboard
5. `mark_booking_email_drafted` (idempotent)

Fallback: poll `list_new_quotations` if webhook missed.

## Local check

```bash
npm run verify:booking-draft
```

## Example tool call (curl smoke test)

MCP uses Streamable HTTP JSON-RPC — use an MCP client (Grok, Cursor, MCP Inspector) rather than raw curl for full handshake.
