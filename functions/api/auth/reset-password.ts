import { z } from 'zod';
import { AppContext, error, json, nowIso } from '../../lib/env';
import { hashPassword } from '../../lib/auth';

const Schema = z.object({ token: z.string().min(10), password: z.string().min(8) });

export const onRequestPost = async (ctx: AppContext) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return error(400, 'invalid_json');
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return error(400, 'validation_failed');

  const userId = await ctx.env.SESSIONS.get(`pwreset:${parsed.data.token}`);
  if (!userId) return error(400, 'invalid_or_expired_token');

  const hash = await hashPassword(parsed.data.password);
  await ctx.env.DB.prepare(`UPDATE users SET password_hash = ?, updated_date = ? WHERE id = ?`)
    .bind(hash, nowIso(), userId)
    .run();
  await ctx.env.SESSIONS.delete(`pwreset:${parsed.data.token}`);
  return json({ ok: true });
};
