#!/usr/bin/env node
/**
 * LINE Phase 1 — create compact rich menu (2500×843), upload image (JPEG or PNG), set default for all users.
 *
 * @see https://developers.line.biz/en/docs/messaging-api/using-rich-menus/
 * @see Plan: LINE Phase 1 — cargo.omgexp.com URIs → customer Google login
 *
 * Usage:
 *   set LINE_CHANNEL_ACCESS_TOKEN (Messaging API channel, long-lived)
 *   node scripts/line-phase1/create-rich-menu-default.mjs <path-to-menu.jpg|.png>
 *
 * Image dimensions must exactly match WIDTH × HEIGHT below (compact bar).
 */

import fs from 'node:fs';
import path from 'node:path';

const WIDTH = 2500;
const HEIGHT = 843;

const BASE = process.env.LINE_SITE_BASE?.replace(/\/$/, '') ?? 'https://cargo.omgexp.com';

/** Three equal columns; image should label three tap zones visually. */
const richMenuPayload = {
  size: { width: WIDTH, height: HEIGHT },
  selected: false,
  name: 'Cargo_OMG_Customer_Menu_Phase1',
  chatBarText: 'Menu',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: HEIGHT },
      action: {
        type: 'uri',
        label: 'Login',
        uri: `${BASE}/site/login`,
      },
    },
    {
      bounds: { x: 833, y: 0, width: 833, height: HEIGHT },
      action: {
        type: 'uri',
        label: 'Website',
        uri: `${BASE}/site`,
      },
    },
    {
      bounds: { x: 1666, y: 0, width: 834, height: HEIGHT },
      action: {
        type: 'uri',
        label: 'Quote',
        uri: `${BASE}/shipping-calculator`,
      },
    },
  ],
};

/** LINE rejects uploads larger than ~1 MiB (typically HTTP 413 from api-data.line.me). */
const MAX_UPLOAD_BYTES = 1024 * 1024;

/** LINE accepts image/jpeg or image/png for rich menu uploads. */
function contentTypeFromPath(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return null;
}

async function main() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    console.error('Missing LINE_CHANNEL_ACCESS_TOKEN in environment.');
    process.exit(1);
  }

  const imagePath = process.argv[2];
  if (!imagePath || !fs.existsSync(imagePath)) {
    console.error(
      `Usage: LINE_CHANNEL_ACCESS_TOKEN=xxx node scripts/line-phase1/create-rich-menu-default.mjs <${WIDTH}x${HEIGHT}.jpg|.png|.jpeg>`
    );
    process.exit(1);
  }

  const contentType = contentTypeFromPath(imagePath);
  if (!contentType) {
    console.error('Image must be .jpg, .jpeg, or .png (LINE Messaging API).');
    process.exit(1);
  }

  const stat = fs.statSync(imagePath);
  if (stat.size > MAX_UPLOAD_BYTES) {
    console.error(
      `Image is ${Math.round(stat.size / 1024)} KiB (> ${MAX_UPLOAD_BYTES / 1024 / 1024} MiB). LINE returns 413. ` +
        'Export JPEG/PNG compressed (e.g. quality 75–85) or shrink detail until file is under 1 MiB. Keep dimensions exactly 2500×843 px.'
    );
    process.exit(1);
  }

  const imageBuf = fs.readFileSync(imagePath);

  console.log(`Creating rich menu (${WIDTH}×${HEIGHT}) with base URLs: ${BASE} (${contentType}) …`);

  const createRes = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(richMenuPayload),
  });

  const createBody = await createRes.text();
  if (!createRes.ok) {
    console.error('POST /richmenu failed:', createRes.status, createBody);
    process.exit(1);
  }

  const { richMenuId } = JSON.parse(createBody);
  if (!richMenuId) {
    console.error('Unexpected response:', createBody);
    process.exit(1);
  }

  console.log('richMenuId:', richMenuId);

  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: imageBuf,
  });

  const uploadBody = await uploadRes.text().catch(() => '');
  if (!uploadRes.ok) {
    console.error('POST richmenu/content failed:', uploadRes.status, uploadBody);
    process.exit(1);
  }

  const defaultRes = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const defaultBody = await defaultRes.text().catch(() => '');
  if (!defaultRes.ok) {
    console.error('POST user/all/richmenu failed:', defaultRes.status, defaultBody);
    process.exit(1);
  }

  console.log(`Done. Default rich menu set for new chats. (${path.basename(imagePath)} uploaded)`);
}

main();
