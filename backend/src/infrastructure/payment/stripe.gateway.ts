// src/infrastructure/payment/stripe.gateway.ts
// Minimal Stripe adapter: createPaymentIntent (used by checkout.service)

import Stripe from "stripe";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

const STRIPE_KEY = env.STRIPE_SECRET_KEY;
export const stripeClient = STRIPE_KEY ? new Stripe(STRIPE_KEY, { apiVersion: "2023-10-16" }) : null;

export const stripeGateway = {
  async createPaymentIntent(args: { amount: number; currency: string; metadata?: Record<string, any> }) {
    if (!stripeClient) {
      throw new Error("Stripe client not configured. Set STRIPE_SECRET_KEY.");
    }
    const intent = await stripeClient.paymentIntents.create({
      amount: Math.max(0, Math.floor(args.amount || 0)),
      currency: (args.currency || "IRT").toLowerCase(),
      metadata: args.metadata || {},
      automatic_payment_methods: { enabled: true },
    });
    logger.info({ id: intent.id, amount: intent.amount, currency: intent.currency }, "Stripe PI created");
    return {
      id: intent.id,
      clientSecret: intent.client_secret || undefined,
      amount: intent.amount,
      currency: intent.currency.toUpperCase(),
    };
  },
};

export default stripeGateway;