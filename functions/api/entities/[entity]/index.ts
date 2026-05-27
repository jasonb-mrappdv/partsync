import { AppContext, error, json, newId, nowIso } from '../../../lib/env';
import { entities, fromRow, parseSort, resolveEntity, toRow } from '../../../lib/entities';

const scopeWhere = (entityKey: string, user: NonNullable<AppContext['data']['user']>) => {
  if (user.role === 'admin') return { sql: '', params: [] as unknown[] };
  if (user.role === 'vendor' && (entityKey === 'PartOrder' || entityKey === 'ReturnLog')) {
    return { sql: 'WHERE vendor_id = ?', params: [user.vendor_id ?? ''] };
  }
  if (user.role === 'technician' && entityKey === 'TechnicianLog') {
    return { sql: 'WHERE technician_email = ?', params: [user.email] };
  }
  return { sql: '', params: [] };
};

export const onRequestGet = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const entityKey = ctx.params.entity as string;
  const def = resolveEntity(entityKey);
  if (!def) return error(404, 'unknown_entity');

  const url = new URL(ctx.request.url);
  const sort = url.searchParams.get('sort');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10) || 500, 1000);

  const { sql: whereSql, params } = scopeWhere(entityKey, user);
  const sortSql = parseSort(sort, def);
  const stmt = ctx.env.DB.prepare(
    `SELECT * FROM ${def.table} ${whereSql} ORDER BY ${sortSql} LIMIT ?`
  ).bind(...params, limit);
  const { results } = await stmt.all<Record<string, unknown>>();
  return json(results.map((r) => fromRow(def, r)));
};

export const onRequestPost = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const entityKey = ctx.params.entity as string;
  const def = resolveEntity(entityKey);
  if (!def) return error(404, 'unknown_entity');

  // Only admins can create Users via this endpoint.
  if (entityKey === 'User' && user.role !== 'admin') return error(403, 'forbidden');

  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return error(400, 'invalid_json');
  }

  const parsed = def.schema.safeParse(body);
  if (!parsed.success) {
    return error(400, 'validation_failed', { issues: parsed.error.issues });
  }

  const row = toRow(def, parsed.data as Record<string, unknown>);
  const id = newId();
  const now = nowIso();
  row.id = id;
  row.created_by = user.id;
  row.created_date = now;
  row.updated_date = now;

  // Default vendor_id for vendor-scoped creates.
  if (user.role === 'vendor' && (entityKey === 'PartOrder' || entityKey === 'ReturnLog') && !row.vendor_id) {
    row.vendor_id = user.vendor_id;
  }

  const cols = Object.keys(row);
  const placeholders = cols.map(() => '?').join(',');
  const values = cols.map((c) => row[c] ?? null);
  await ctx.env.DB.prepare(`INSERT INTO ${def.table} (${cols.join(',')}) VALUES (${placeholders})`).bind(...values).run();

  const created = await ctx.env.DB.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  return json(fromRow(def, created!), { status: 201 });
};

// Touch entities map so TS doesn't tree-shake the type import. (No-op.)
export const _ = entities;
