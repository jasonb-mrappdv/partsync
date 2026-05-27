import { json } from '../lib/env';

export const onRequestGet = () => json({ ok: true, service: 'partsync', ts: new Date().toISOString() });
