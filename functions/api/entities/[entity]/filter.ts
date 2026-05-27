import { AppContext, error, json } from '../../../lib/env';
import { fromRow, parseSort, resolveEntity } from '../../../lib/entities';

export const onRequestPost = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const entityKey = ctx.params.entity as string;
  const def = resolveEntity(entityKey);
  if (!def) return error(404, 'unknown_entity');

  let body: { query?: Record<string, unknown>; sort?: string; limit?: number };
  try {
    body = (await ctx.request.json()) as typeof body;
  } catch {
    return error(400, 'invalid_json');
  }

  const query = body.query || {};
  const limit = Math.min(body.limit ?? 500, 1000);
  const sortSql = parseSort(body.sort ?? null, def);

  const allowedCols = new Set([...Object.keys(def.schema.shape), 'id', 'created_by', 'created_date', 'updated_date']);
  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (!allowedCols.has(k)) continue;
    if (v === null) {
      clauses.push(`${k} IS NULL`);
    } else {
      clauses.push(`${k} = ?`);
      params.push(typeof v === 'boolean' ? (v ? 1 : 0) : v);
    }
  }

  // Role scoping (admin sees all, others scoped).
  if (user.role === 'vendor' && (entityKey === 'PartOrder' || entityKey === 'ReturnLog')) {
    clauses.push('vendor_id = ?');
    params.push(user.vendor_id ?? '');
  } else if (user.role === 'technician' && entityKey === 'TechnicianLog') {
    clauses.push('technician_email = ?');
    params.push(user.email);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { results } = await ctx.env.DB.prepare(
    `SELECT * FROM ${def.table} ${whereSql} ORDER BY ${sortSql} LIMIT ?`
  )
    .bind(...params, limit)
    .all<Record<string, unknown>>();
  return json(results.map((r) => fromRow(def, r)));
};
