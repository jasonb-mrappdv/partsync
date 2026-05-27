import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    const orders = await base44.asServiceRole.entities.PartOrder.filter({ id: order_id });
    const order = orders[0];

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.customer_email) {
      return Response.json({ error: 'No customer email on this order' }, { status: 400 });
    }

    const deliveryText = order.estimated_delivery
      ? `Estimated delivery: **${new Date(order.estimated_delivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}**`
      : 'Estimated delivery date will be updated soon.';

    const body = `
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

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: order.customer_email,
      subject: `Your Part Is On Its Way — Tracking #${order.tracking_number}`,
      body,
    });

    // Mark notification as sent
    await base44.asServiceRole.entities.PartOrder.update(order_id, { notification_sent: true });

    return Response.json({ success: true, sent_to: order.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});