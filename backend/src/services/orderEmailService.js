import { sendMail } from "../config/mailer.js";
import { logger } from "../utils/logger.js";

/**
 * Customer emails for order milestones. Sending is best-effort: a mail failure is logged
 * and never blocks a payment or a status change.
 */

const STORE_NAME = "Shoppe";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const naira = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const shortId = (id) => `#${String(id).slice(0, 8).toUpperCase()}`;

const ordersUrl = () => new URL("/account/orders", process.env.FRONTEND_URL || "http://localhost:3000").toString();

const itemLines = (order) =>
  (order.orderItems || []).map((item) => ({
    name: item.product?.name || "Item",
    quantity: item.quantity,
    lineTotal: Number(item.price) * item.quantity,
  }));

const layout = ({ heading, intro, order, extra = "" }) => {
  const rows = itemLines(order)
    .map(
      (item) => `<tr>
  <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;">${escapeHtml(item.name)} × ${item.quantity}</td>
  <td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-family:monospace;">${naira(item.lineTotal)}</td>
</tr>`
    )
    .join("");
  return `<div style="max-width:520px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#141414;">
  <div style="background:#FFC400;border:2px solid #141414;border-radius:8px;padding:20px 24px;">
    <p style="margin:0;font-size:22px;font-weight:800;">${escapeHtml(heading)}</p>
    <p style="margin:6px 0 0;font-family:monospace;">Order ${shortId(order.id)}</p>
  </div>
  <p style="margin:20px 0;">${escapeHtml(intro)}</p>
  <table style="width:100%;border-collapse:collapse;font-size:15px;">${rows}
    <tr><td style="padding:8px 0;">Delivery${order.shippingMethodName ? ` (${escapeHtml(order.shippingMethodName)})` : ""}</td>
        <td style="padding:8px 0;text-align:right;font-family:monospace;">${naira(order.shippingFee)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:700;">Total</td>
        <td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:700;">${naira(order.total)}</td></tr>
  </table>
  <p style="margin:20px 0 6px;">Delivering to: ${escapeHtml(
    [order.shippingName, order.shippingStreet, order.shippingCity, order.shippingState].filter(Boolean).join(", ")
  )}</p>
  ${extra}
  <p style="margin:24px 0;"><a href="${ordersUrl()}" style="background:#141414;color:#FAF7F0;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700;">View my orders</a></p>
  <p style="color:#57534e;font-size:13px;">Questions? Just reply to this email.</p>
</div>`;
};

const textBody = ({ heading, intro, order }) =>
  [
    heading,
    `Order ${shortId(order.id)}`,
    "",
    intro,
    "",
    ...itemLines(order).map((item) => `- ${item.name} × ${item.quantity}: ${naira(item.lineTotal)}`),
    `Delivery: ${naira(order.shippingFee)}`,
    `Total: ${naira(order.total)}`,
    "",
    `Track your order: ${ordersUrl()}`,
  ].join("\n");

const send = async (order, { subject, heading, intro }) => {
  const to = order?.user?.email;
  if (!to) return;
  try {
    await sendMail({ to, subject, text: textBody({ heading, intro, order }), html: layout({ heading, intro, order }) });
  } catch (err) {
    logger.warn(`[Mail] Order email failed for ${shortId(order.id)}: ${err.message}`);
  }
};

export const orderEmailService = {
  async sendOrderConfirmed(order) {
    const first = order?.user?.name?.split(" ")[0] || "there";
    await send(order, {
      subject: `${STORE_NAME}: order ${shortId(order.id)} confirmed`,
      heading: "Thanks, your order is confirmed",
      intro: `Hi ${first}, we've received your payment and we're getting your order ready.`,
    });
  },

  async sendOrderShipped(order) {
    const first = order?.user?.name?.split(" ")[0] || "there";
    await send(order, {
      subject: `${STORE_NAME}: order ${shortId(order.id)} is on its way`,
      heading: "Your order is on its way",
      intro: `Hi ${first}, good news: your order has shipped and is heading to you.`,
    });
  },
};
