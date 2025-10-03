export declare const paypalGateway: {
    createOrder(args: {
        amount: number;
        currency: string;
        returnUrl: string;
        cancelUrl: string;
        metadata?: Record<string, any>;
    }): Promise<{
        id: string;
        approvalUrl: string | undefined;
        amount: number;
        currency: string;
    }>;
};
export default paypalGateway;
//# sourceMappingURL=paypal.gateway.d.ts.map