// Hand-rolled client that mirrors the @base44/sdk surface used by the app.
// Backed by Cloudflare Pages Functions at /api/*. Authentication is via
// HttpOnly cookie set by the server, so there is no client-side token store.

const ENTITY_NAMES = [
  'PartOrder',
  'ReturnLog',
  'Vendor',
  'RoutingRule',
  'TechnicianLog',
  'User',
];

const request = async (path, init = {}) => {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

const safeJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const makeEntity = (name) => ({
  /**
   * list(sort?, limit?) — '-field' = DESC, 'field' = ASC. Default sort: '-created_date'.
   */
  list: (sort, limit) => {
    const qs = new URLSearchParams();
    if (sort) qs.set('sort', sort);
    if (limit) qs.set('limit', String(limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request(`/api/entities/${name}${suffix}`);
  },
  filter: (query, sort, limit) =>
    request(`/api/entities/${name}/filter`, {
      method: 'POST',
      body: JSON.stringify({ query, sort, limit }),
    }),
  get: (id) => request(`/api/entities/${name}/${encodeURIComponent(id)}`),
  create: (data) => request(`/api/entities/${name}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/api/entities/${name}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id) => request(`/api/entities/${name}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
});

const entities = Object.fromEntries(ENTITY_NAMES.map((k) => [k, makeEntity(k)]));

const auth = {
  me: () => request('/api/auth/me'),

  loginViaEmailPassword: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: ({ email, password, full_name }) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name }),
    }),

  // OTP flow isn't implemented in this Cloudflare backend — registration
  // auto-establishes a session. These are no-ops kept for SDK compatibility.
  verifyOtp: async () => ({ access_token: 'cookie-session' }),
  resendOtp: async () => ({ ok: true }),
  setToken: () => {
    // No-op: session lives in an HttpOnly cookie.
  },

  logout: async (returnUrl) => {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // best-effort
    }
    if (typeof window !== 'undefined' && returnUrl !== undefined) {
      window.location.href = '/login';
    }
  },

  redirectToLogin: (returnUrl) => {
    if (typeof window === 'undefined') return;
    const dest = returnUrl ? `/login?next=${encodeURIComponent(returnUrl)}` : '/login';
    window.location.href = dest;
  },

  loginWithProvider: () => {
    throw new Error('Social sign-in is not configured. Please use email + password.');
  },

  forgotPassword: (email) =>
    request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token, password) =>
    request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/files/upload', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) {
        const err = new Error('Upload failed');
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    // SendEmail is server-side only in this Cloudflare backend.
    SendEmail: async () => {
      throw new Error('SendEmail is server-side only.');
    },
  },
};

const functions = {
  sendTrackingEmail: ({ order_id }) =>
    request('/api/functions/sendTrackingEmail', {
      method: 'POST',
      body: JSON.stringify({ order_id }),
    }),
};

export const base44 = {
  entities,
  auth,
  integrations,
  functions,
};
