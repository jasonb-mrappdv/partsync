import { AppContext, error, json } from '../../lib/env';

export const onRequestGet = async (ctx: AppContext) => {
  const user = ctx.data.user;
  if (!user) return error(401, 'auth_required');
  // Always hit DB for fresh role/vendor_id so impersonation works after admin edits.
  const row = await ctx.env.DB.prepare(
    `SELECT id, email, role, vendor_id, full_name FROM users WHERE id = ?`
  )
    .bind(user.id)
    .first<{ id: string; email: string; role: string; vendor_id: string | null; full_name: string | null }>();
  if (!row) return error(401, 'auth_required');
  return json(row);
};
