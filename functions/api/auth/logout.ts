import { AppContext, json } from '../../lib/env';
import { clearSessionCookie } from '../../lib/auth';

export const onRequestPost = async (ctx: AppContext) =>
  json({ ok: true }, { headers: { 'set-cookie': clearSessionCookie(ctx.env.APP_ENV !== 'development') } });
