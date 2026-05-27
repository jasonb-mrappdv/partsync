import { z } from 'zod';
import { AppContext, error, json } from '../../lib/env';
import { sessionCookie, signJWT, verifyPassword } from '../../lib/auth';

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

export const onRequestPost = async (ctx: AppContext) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return error(400, 'invalid_json');
  }
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return error(400, 'validation_failed');
  const { email, password } = parsed.data;

  const user = await ctx.env.DB.prepare(
    `SELECT id, email, password_hash, role, vendor_id, full_name FROM users WHERE email = ?`
  )
    .bind(email)
    .first<{
      id: string;
      email: string;
      password_hash: string;
      role: 'admin' | 'vendor' | 'technician' | 'user';
      vendor_id: string | null;
      full_name: string | null;
    }>();
  if (!user) return error(401, 'invalid_credentials');

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return error(401, 'invalid_credentials');

  const token = await signJWT(
    { sub: user.id, email: user.email, role: user.role, vendor_id: user.vendor_id },
    ctx.env.JWT_SECRET
  );
  return json(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name, vendor_id: user.vendor_id },
    { headers: { 'set-cookie': sessionCookie(token, undefined, ctx.env.APP_ENV !== 'development') } }
  );
};
