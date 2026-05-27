// Vestigial from the Base44 SDK era. Kept as a stable export so any import
// from existing pages doesn't break; values are no longer meaningful for
// the Cloudflare backend (auth lives in an HttpOnly cookie).

export const appParams = {
  appId: 'partsync',
  token: null,
  fromUrl: typeof window !== 'undefined' ? window.location.href : '',
  functionsVersion: null,
  appBaseUrl: typeof window !== 'undefined' ? window.location.origin : '',
};
