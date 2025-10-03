// src/infrastructure/payment/paypal.gateway.ts
// Minimal PayPal adapter: create order via REST API (v2).
// Requires PAYPAL_CLIENT_ID and PAYPAL_SECRET; uses sandbox if PAYPAL_ENV=sandbox.
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
const BASE =
  String(env.PAYPAL_ENV || "sandbox") === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
async function getToken() {
  const id = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error("PayPal credentials missing.");
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}
export const paypalGateway = {
  async createOrder(args) {
    const token = await getToken();
    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: (args.currency || "IRR").toUpperCase(),
            value: String(Math.max(0, Math.floor(args.amount || 0))),
          },
          custom_id: args.metadata?.orderId || undefined,
          invoice_id: args.metadata?.orderNumber || undefined,
        },
      ],
      application_context: {
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
      },
    };
    const res = await fetch(`${BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PayPal order error: ${res.status}`);
    const data = await res.json();
    const approvalLink = (data.links || []).find(
      (l) => l.rel === "approve"
    )?.href;
    logger.info({ id: data.id, amount: args.amount }, "PayPal order created");
    return {
      id: data.id,
      approvalUrl: approvalLink,
      amount: args.amount,
      currency: (args.currency || "IRR").toUpperCase(),
    };
  },
};
export default paypalGateway;
//# sourceMappingURL=paypal.gateway.js.map
