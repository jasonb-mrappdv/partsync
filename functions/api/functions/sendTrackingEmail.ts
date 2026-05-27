import { AppContext, error, json, nowIso } from '../../lib/env';
import { sendEmail } from '../../lib/email';

// Port of base44/functions/sendTrackingEmail/entry.ts. Manually-triggered
// resend of the tracking email for a given order. Admin/vendor scoped.
export const onRequestPost = async (ctx: AppContext) => {
  const user = ctx.data.user!;
  let body: { order_id?: string };
  try {
    body = (await ctx.request.json()) as { order_id?: string };
  } catch {
    return error(400, 'invalid_json');
  }
  if (!body.order_id) return error(400, 'order_id required');

  const order = await ctx.env.DB.prepare(`SELECT * FROM part_orders WHERE id = ?`).bind(body.order_id).first<Record<string, unknown>>();
  if (!order) return error(404, 'Order not found');

  if (user.role !== 'admin' && !(user.role === 'vendor' && order.vendor_id === user.vendor_id)) {
    return error(403, 'forbidden');
  }
  if (!order.customer_email) return error(400, 'No customer email on this order');

  const deliveryText = order.estimated_delivery
    ? `Estimated delivery: **${new Date(order.estimated_delivery as string).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}**`
    : 'Estimated delivery date will be updated soon.';

  const text = `
Hello ${order.customer_name || 'Valued Customer'},

Great news! Your part order has shipped and is on its way.

**Order Details:**
- Part Number: ${order.part_number}
- Purchase Order: ${order.purchase_order}
- Tracking Number: ${order.tracking_number}
- Vendor: ${order.vendor_name || 'N/A'}

${deliveryText}

You can use your tracking number to monitor the shipment status with the carrier.

If you have any questions about your order, please don't hesitate to contact us.

Thank you for your business!
  `.trim();

  await sendEmail(ctx.env, {
    to: order.customer_email as string,
    subject: `Your Part Is On Its Way — Tracking #${order.tracking_number}`,
    body: text,
  });

  await ctx.env.DB.prepare(`UPDATE part_orders SET notification_sent = 1, updated_date = ? WHERE id = ?`)
    .bind(nowIso(), body.order_id)
    .run();

  return json({ success: true, sent_to: order.customer_email });
};
