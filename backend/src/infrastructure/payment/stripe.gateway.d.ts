import Stripe from "stripe";
export declare const stripeClient: Stripe | null;
export declare const stripeGateway: {
    createPaymentIntent(args: {
        amount: number;
        currency: string;
        metadata?: Record<string, any>;
    }): Promise<{
        id: string;
        clientSecret: string | undefined;
        amount: number;
        currency: string;
    }>;
};
export default stripeGateway;
//# sourceMappingURL=stripe.gateway.d.ts.map