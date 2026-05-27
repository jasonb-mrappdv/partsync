import { AppContext, RequestData, error } from '../lib/env';
import { getUserFromRequest } from '../lib/auth';

const PUBLIC_PREFIXES = ['/api/health', '/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];

export const onRequest = async (ctx: AppContext) => {
  const url = new URL(ctx.request.url);
  const user = await getUserFromRequest(ctx.request, ctx.env);
  (ctx.data as RequestData).user = user;

  // CORS preflight (same-origin in prod, but useful for `wrangler pages dev`).
  if (ctx.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': ctx.request.headers.get('origin') || '*',
        'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'access-control-allow-headers': 'content-type, authorization',
        'access-control-allow-credentials': 'true',
      },
    });
  }

  const isPublic = PUBLIC_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'));
  if (!isPublic && !user) {
    return error(401, 'auth_required');
  }

  return ctx.next();
};
