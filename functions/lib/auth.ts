import { AuthUser, Env } from './env';

// Minimal HS256 JWT — avoids pulling in `jose` to keep cold start small.
// Payload: { sub, email, role, vendor_id, exp }

const enc = new TextEncoder();
const dec = new TextDecoder();

const b64urlEncode = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const b64urlDecode = (s: string): Uint8Array => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

const importKey = (secret: string) =>
  crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export type JWTPayload = {
  sub: string;
  email: string;
  role: AuthUser['role'];
  vendor_id: string | null;
  exp: number;
};

export const signJWT = async (payload: Omit<JWTPayload, 'exp'>, secret: string, ttlSec = 60 * 60 * 24 * 7) => {
  const header = b64urlEncode(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64urlEncode(enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })));
  const data = `${header}.${body}`;
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return `${data}.${b64urlEncode(sig)}`;
};

export const verifyJWT = async (token: string, secret: string): Promise<JWTPayload | null> => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const key = await importKey(secret);
    const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(`${header}.${body}`));
    if (!ok) return null;
    const payload = JSON.parse(dec.decode(b64urlDecode(body))) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

// Password hashing — PBKDF2-SHA256 with 100k iterations, 16-byte salt.
// Encoded as: pbkdf2$<iter>$<saltB64>$<hashB64>
const PBKDF2_ITER = 100_000;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
    key,
    256
  );
  return `pbkdf2$${PBKDF2_ITER}$${b64urlEncode(salt)}$${b64urlEncode(bits)}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, iterStr, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const iter = parseInt(iterStr, 10);
  const salt = b64urlDecode(saltB64);
  const expected = b64urlDecode(hashB64);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, expected.length * 8)
  );
  if (bits.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
  return diff === 0;
};

export const parseCookies = (req: Request): Record<string, string> => {
  const header = req.headers.get('cookie') || '';
  const out: Record<string, string> = {};
  header.split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i < 0) return;
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
};

export const sessionCookie = (jwt: string, maxAgeSec = 60 * 60 * 24 * 7, secure = true) =>
  `partsync_session=${jwt}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;

export const clearSessionCookie = (secure = true) =>
  `partsync_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? '; Secure' : ''}`;

export const getUserFromRequest = async (req: Request, env: Env): Promise<AuthUser | null> => {
  const cookies = parseCookies(req);
  const token = cookies.partsync_session;
  if (!token) return null;
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    vendor_id: payload.vendor_id,
    full_name: null,
  };
};
