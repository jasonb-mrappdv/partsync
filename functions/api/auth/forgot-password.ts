import { z } from 'zod';
import { AppContext, error, json, newId } from '../../lib/env';
import { sendEmail } from '../../lib/email';

const Schema = z.object({ email: z.string().email() });

export const onRequestPost = async (ctx: AppContext) => {
  let body: unknown;
  try {
    body = await ctx.request.json();
  } catch {
    return error(400, 'invalid_json');
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return error(400, 'validation_failed');

  const user = await ctx.env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(parsed.data.email).first<{ id: string }>();
  // Always 200 to avoid email enumeration. Only actually send when user exists.
  if (user) {
    const token = newId().replace(/-/g, '');
    await ctx.env.SESSIONS.put(`pwreset:${token}`, user.id, { expirationTtl: 60 * 60 });
    const url = new URL(ctx.request.url);
    const link = `${url.origin}/reset-password?token=${token}`;
    try {
      await sendEmail(ctx.env, {
        to: parsed.data.email,
        subject: 'PartSync password reset',
        body: `Click the link to reset your password (expires in 1 hour):\n\n${link}\n\nIf you didn't request this, you can ignore this email.`,
      });
    } catch (e) {
      console.error('forgot-password email failed', e);
    }
  }
  return json({ ok: true });
};
