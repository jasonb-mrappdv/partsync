import { Env } from './env';

export const sendEmail = async (
  env: Env,
  { to, subject, body, html }: { to: string; subject: string; body?: string; html?: string }
) => {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping outbound email to', to);
    return { skipped: true };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [to],
      subject,
      text: body,
      html: html ?? body?.replace(/\n/g, '<br>'),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend failed (${res.status}): ${detail}`);
  }
  return res.json();
};
