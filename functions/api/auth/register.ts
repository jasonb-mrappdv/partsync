import { z } from 'zod';
import { AppContext, error, json, newId, nowIso } from '../../lib/env';
import { hashPassword, sessionCookie, signJWT } from '../../lib/auth';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().optional(),
});

export const onRequestPost = async (ctx: AppContext) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return error(400, 'invalid_json');
  }
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return error(400, 'validation_failed', { issues: parsed.error.issues });
  const { email, password, full_name } = parsed.data;

  const existing = await ctx.env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
  if (existing) return error(409, 'email_in_use');

  // First user becomes admin (bootstrap convenience). Everyone else defaults to 'user'.
  const countRow = await ctx.env.DB.prepare(`SELECT COUNT(*) AS n FROM users`).first<{ n: number }>();
  const role = (countRow?.n ?? 0) === 0 ? 'admin' : 'user';

  const id = newId();
  const password_hash = await hashPassword(password);
  const now = nowIso();
  await ctx.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, full_name, role, email_verified, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  )
    .bind(id, email, password_hash, full_name ?? null, role, now, now)
    .run();

  const token = await signJWT({ sub: id, email, role, vendor_id: null }, ctx.env.JWT_SECRET);
  return json(
    { id, email, role, full_name: full_name ?? null, requires_otp: false },
    {
      status: 201,
      headers: { 'set-cookie': sessionCookie(token, undefined, ctx.env.APP_ENV !== 'development') },
    }
  );
};
