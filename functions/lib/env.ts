// Shared types and helpers for Pages Functions runtime bindings.

export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  SESSIONS: KVNamespace;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM: string;
  PUBLIC_BUCKET_URL: string;
  APP_ENV: string;
}

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'vendor' | 'technician' | 'user';
  vendor_id: string | null;
  full_name: string | null;
};

export interface RequestData {
  user: AuthUser | null;
}

export type AppContext = EventContext<Env, string, RequestData>;

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });

export const error = (status: number, message: string, extra: Record<string, unknown> = {}) =>
  json({ error: message, ...extra }, { status });

export const newId = () => crypto.randomUUID();

export const nowIso = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
