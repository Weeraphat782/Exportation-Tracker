# LINE Phase 1 — Operators checklist (Cargo OMGEXP)

Goals: OA friends see a Rich Menu → tap **Login** → `SITE_BASE/site/login` → Google OAuth → `/portal`.

No webhook or DB linkage in this phase (see Phase 2).

## 1) LINE Developers & Official Account

1. Create/use a [LINE Official Account](https://www.line.biz/) for the brand.
2. Enable **Messaging API** and open [LINE Developers Console](https://developers.line.biz/console/) for that channel.
3. Issue a **long-lived Channel access token** (Messaging API tab). Export it only on your machine:
   ```text
   set LINE_CHANNEL_ACCESS_TOKEN=...your_token...
   ```
4. Optionally save **Channel secret** somewhere safe for Phase 2 webhooks — not required here.
5. **Webhook**: leave unset or dummy until you ship a webhook route (do not verify a fake URL).

Reference: [Messaging API — Get started](https://developers.line.biz/en/docs/messaging-api/getting-started/)

## 2) MCP in Cursor (`@line/line-bot-mcp-server`)

Requirements: Node.js **v20+**.

In **Cursor → Settings → MCP**, add (adjust to your MCP UI):

```json
{
  "mcpServers": {
    "line-bot": {
      "command": "npx",
      "args": ["@line/line-bot-mcp-server"],
      "env": {
        "NPM_CONFIG_IGNORE_SCRIPTS": "true",
        "CHANNEL_ACCESS_TOKEN": "PASTE_SAME_LONG_LIVED_TOKEN",
        "DESTINATION_USER_ID": "OPTIONAL_YOUR_LINE_USER_ID"
      }
    }
  }
}
```

After reload, tools such as **`create_rich_menu`**, **`get_rich_menu_list`**, **`set_rich_menu_default`**, **`get_follower_ids`** should appear. Repo: https://github.com/line/line-bot-mcp-server

Use MCP if you prefer the AI to assemble menu layout + artwork; otherwise use **§3**.

## 3) Repo script (alternative to MCP artwork)

Uses the same Messaging API as MCP.

### Artwork

Supply **JPEG or PNG** exactly **2500 × 843** px (compact rich menu bar). **File size must be under ~1 MiB** (LINE returns **413 Request Entity Too Large** if heavier—common with uncompressed PNG); use compression or JPEG if needed.

Designer should align three tap zones visually with the thirds used in `create-rich-menu-default.mjs`.

### Run (PowerShell example)

From repo root (`Tr/`):

```powershell
$env:LINE_CHANNEL_ACCESS_TOKEN="YOUR_LONG_LIVED_TOKEN"
# Optional: staging origin
# $env:LINE_SITE_BASE="https://staging.example.com"
pnpm exec node scripts/line-phase1/create-rich-menu-default.mjs C:\path\to\menu-2500x843.png
```

Or with npm script:

```powershell
pnpm run line:rich-menu-phase1 -- C:\path\to\menu-2500x843.png
```

Script steps: `POST /v2/bot/richmenu` → upload JPEG or PNG → `POST /v2/bot/user/all/richmenu/{id}`.

## 4) Supabase (already required for Google login)

- **Site URL** `https://cargo.omgexp.com`
- **Redirect URLs** include:
  - `https://cargo.omgexp.com/site/login`
  - `https://cargo.omgexp.com/site/auth/callback`

## 5) Verification (mobile)

1. Friend the OA via QR.
2. Open chat → see Rich Menu.
3. Tap **Login** → site shows customer sign-in → **Continue with Google** completes → **`/portal`**.

If OAuth fails on device, inspect the `/site/auth/callback` screen (hash/query errors surfaced in app) and confirm env + redirects on Vercel.
