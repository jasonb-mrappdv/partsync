import { AppContext, error, json, newId } from '../../lib/env';

// Server-side R2 upload (multipart/form-data with field "file").
// Returns { file_url } to match the Base44 SDK's UploadFile shape.
export const onRequestPost = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const ct = ctx.request.headers.get('content-type') || '';
  if (!ct.startsWith('multipart/form-data')) return error(400, 'expected_multipart');

  const form = await ctx.request.formData();
  const file = form.get('file') as unknown as File | null;
  if (!file || typeof (file as File).arrayBuffer !== 'function') return error(400, 'missing_file');
  if (file.size > 10 * 1024 * 1024) return error(413, 'file_too_large');

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
  const safeName = `${user.id}/${Date.now()}-${newId()}.${ext}`;

  await ctx.env.UPLOADS.put(safeName, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  const file_url = `${ctx.env.PUBLIC_BUCKET_URL.replace(/\/$/, '')}/${safeName}`;
  return json({ file_url, key: safeName });
};
