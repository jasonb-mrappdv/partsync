import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    // Only process when tracking_number is newly added (was empty, now has value)
    const hadTracking = old_data?.tracking_number;
    const hasTracking = data?.tracking_number;

    if (!hasTracking || hadTracking) {
      return Response.json({ skipped: true, reason: 'No new tracking number' });
    }

    if (!data.customer_email) {
      return Response.json({ skipped: true, reason: 'No customer email' });
    }

    const deliveryText = data.estimated_delivery
      ? `Estimated delivery: ${new Date(data.estimated_delivery).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
      : 'Estimated delivery date will be provided by the carrier.';

    const body = `Hello ${data.customer_name || 'Valued Customer'},

Great news! Your part order has shipped and is on its way to you.

Order Details:
- Part Number: ${data.part_number}
- Purchase Order: ${data.purchase_order}
- Tracking Number: ${data.tracking_number}
- Fulfillment Vendor: ${data.vendor_name || 'N/A'}

${deliveryText}

You can use your tracking number to monitor your shipment status with the carrier.

If you have any questions, please contact us and reference your Purchase Order number.

Thank you for your business!`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: data.customer_email,
      subject: `Your Part Is Shipped — Tracking #${data.tracking_number}`,
      body,
    });

    // Mark notification sent
    await base44.asServiceRole.entities.PartOrder.update(event.entity_id, { notification_sent: true });

    return Response.json({ success: true, sent_to: data.customer_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});