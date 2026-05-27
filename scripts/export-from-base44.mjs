#!/usr/bin/env node
// Best-effort exporter for Base44-hosted entities. The Base44 SDK calls
// `/api/apps/{appId}/entities/{Entity}` against the app's backend host. This
// script does the same, paginating until all rows are pulled. Output goes to
// ./data/<table>.json with column names normalized to our D1 schema.
//
// Requires:
//   BASE44_APP_ID            — e.g. 6a163d5dd3f7f69b380d7ba8
//   BASE44_APP_BASE_URL      — e.g. https://partsync-flow-link.base44.app
//   BASE44_ACCESS_TOKEN      — an admin/service token (grab from a logged-in
//                              browser's localStorage key `base44_access_token`,
//                              OR from the Base44 dashboard if it exposes one)
//
// Usage:
//   BASE44_APP_ID=... BASE44_APP_BASE_URL=... BASE44_ACCESS_TOKEN=... \
//     node scripts/export-from-base44.mjs
//
// NOTE: Base44's exact entity URL pattern can shift between SDK versions; if
// this 404s, inspect a network tab from the live Base44 app and adjust ENTITY_URL.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const { BASE44_APP_ID, BASE44_APP_BASE_URL, BASE44_ACCESS_TOKEN } = process.env;
if (!BASE44_APP_ID || !BASE44_APP_BASE_URL || !BASE44_ACCESS_TOKEN) {
  console.error('Missing env: BASE44_APP_ID, BASE44_APP_BASE_URL, BASE44_ACCESS_TOKEN');
  process.exit(1);
}

const ENTITY_URL = (entity) =>
  `${BASE44_APP_BASE_URL.replace(/\/$/, '')}/api/apps/${BASE44_APP_ID}/entities/${entity}`;

const ENTITIES = [
  { remote: 'PartOrder', table: 'part_orders' },
  { remote: 'ReturnLog', table: 'return_logs' },
  { remote: 'Vendor', table: 'vendors' },
  { remote: 'RoutingRule', table: 'routing_rules' },
  { remote: 'TechnicianLog', table: 'technician_logs' },
];

const fetchAll = async (entity) => {
  const rows = [];
  let offset = 0;
  const pageSize = 200;
  while (true) {
    const url = `${ENTITY_URL(entity)}?limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${BASE44_ACCESS_TOKEN}`, 'X-App-Id': BASE44_APP_ID },
    });
    if (!res.ok) {
      throw new Error(`${entity} fetch failed (${res.status}) ${await res.text()}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return rows;
};

for (const { remote, table } of ENTITIES) {
  try {
    const rows = await fetchAll(remote);
    const out = join(DATA_DIR, `${table}.json`);
    writeFileSync(out, JSON.stringify(rows, null, 2));
    console.log(`${remote}: ${rows.length} rows → ${out}`);
  } catch (e) {
    console.error(`${remote} failed:`, e.message);
  }
}

console.log('\nDone. Next:\n  node scripts/import-to-d1.mjs');
