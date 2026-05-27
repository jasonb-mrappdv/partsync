import { AppContext, error, json, nowIso } from '../../../lib/env';
import { fromRow, resolveEntity, toRow } from '../../../lib/entities';
import { sendEmail } from '../../../lib/email';

const canTouch = (
  entityKey: string,
  user: NonNullable<AppContext['data']['user']>,
  row: Record<string, unknown>
) => {
  if (user.role === 'admin') return true;
  if (user.role === 'vendor' && (entityKey === 'PartOrder' || entityKey === 'ReturnLog')) {
    return row.vendor_id === user.vendor_id;
  }
  if (user.role === 'technician' && entityKey === 'TechnicianLog') {
    return row.technician_email === user.email;
  }
  // Default: creator-only.
  return row.created_by === user.id;
};

const fetchRow = (ctx: AppContext, table: string, id: string) =>
  ctx.env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first<Record<string, unknown>>();

export const onRequestGet = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const entityKey = ctx.params.entity as string;
  const id = ctx.params.id as string;
  const def = resolveEntity(entityKey);
  if (!def) return error(404, 'unknown_entity');
  const row = await fetchRow(ctx, def.table, id);
  if (!row) return error(404, 'not_found');
  if (!canTouch(entityKey, user, row)) return error(403, 'forbidden');
  return json(fromRow(def, row));
};

export const onRequestPatch = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const entityKey = ctx.params.entity as string;
  const id = ctx.params.id as string;
  const def = resolveEntity(entityKey);
  if (!def) return error(404, 'unknown_entity');
  const existing = await fetchRow(ctx, def.table, id);
  if (!existing) return error(404, 'not_found');
  if (!canTouch(entityKey, user, existing)) return error(403, 'forbidden');

  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return error(400, 'invalid_json');
  }

  const partial = def.schema.partial().safeParse(body);
  if (!partial.success) return error(400, 'validation_failed', { issues: partial.error.issues });

  const patch = toRow(def, partial.data as Record<string, unknown>);
  patch.updated_date = nowIso();

  const setSql = Object.keys(patch).map((c) => `${c} = ?`).join(',');
  const values = Object.values(patch).map((v) => v ?? null);
  await ctx.env.DB.prepare(`UPDATE ${def.table} SET ${setSql} WHERE id = ?`).bind(...values, id).run();

  const updated = (await fetchRow(ctx, def.table, id)) as Record<string, unknown>;

  // Inline event trigger: when PartOrder.tracking_number transitions empty→set,
  // mimic the Base44 onOrderTrackingAdded function.
  if (entityKey === 'PartOrder' && !existing.tracking_number && updated.tracking_number && updated.customer_email && !updated.notification_sent) {
    try {
      const deliveryText = updated.estimated_delivery
        ? `Estimated delivery: ${new Date(updated.estimated_delivery as string).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`
        : 'Estimated delivery date will be provided by the carrier.';
      const body = `Hello ${updated.customer_name || 'Valued Customer'},

Great news! Your part order has shipped and is on its way to you.

Order Details:
- Part Number: ${updated.part_number}
- Purchase Order: ${updated.purchase_order}
- Tracking Number: ${updated.tracking_number}
- Fulfillment Vendor: ${updated.vendor_name || 'N/A'}

${deliveryText}

You can use your tracking number to monitor your shipment status with the carrier.

If you have any questions, please contact us and reference your Purchase Order number.

Thank you for your business!`;
      await sendEmail(ctx.env, {
        to: updated.customer_email as string,
        subject: `Your Part Is Shipped — Tracking #${updated.tracking_number}`,
        body,
      });
      await ctx.env.DB.prepare(`UPDATE ${def.table} SET notification_sent = 1 WHERE id = ?`).bind(id).run();
      updated.notification_sent = 1;
    } catch (e) {
      console.error('tracking email failed', e);
    }
  }

  return json(fromRow(def, updated));
};

export const onRequestDelete = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  const entityKey = ctx.params.entity as string;
  const id = ctx.params.id as string;
  const def = resolveEntity(entityKey);
  if (!def) return error(404, 'unknown_entity');
  const existing = await fetchRow(ctx, def.table, id);
  if (!existing) return error(404, 'not_found');
  if (!canTouch(entityKey, user, existing)) return error(403, 'forbidden');

  await ctx.env.DB.prepare(`DELETE FROM ${def.table} WHERE id = ?`).bind(id).run();
  return json({ deleted: id });
};
