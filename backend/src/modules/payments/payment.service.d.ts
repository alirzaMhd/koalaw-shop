declare class PaymentService {
    getById(paymentId: string): Promise<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    }>;
    listForOrder(orderId: string): Promise<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    }[]>;
    markPaid(args: {
        orderId: string;
        paymentId: string;
        transactionRef?: string | null;
        authority?: string | null;
    }): Promise<any>;
    markFailed(args: {
        orderId: string;
        paymentId: string;
        reason?: string | null;
        transactionRef?: string | null;
        authority?: string | null;
    }): Promise<any>;
    refund(args: {
        paymentId: string;
        reason?: string | null;
        amount?: number | null;
    }): Promise<{
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    } | {
        zarinpalRefund: any;
        status: import("@prisma/client").$Enums.PaymentStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        orderId: string;
        currencyCode: string;
        method: import("@prisma/client").$Enums.PaymentMethod;
        amount: number;
        authority: string | null;
        transactionRef: string | null;
        paidAt: Date | null;
    }>;
    handleStripeWebhook(opts: {
        rawBody: Buffer | string;
        headers: Record<string, any>;
    }): Promise<{
        ok: boolean;
    }>;
    handlePaypalWebhook(opts: {
        body: any;
        headers: Record<string, any>;
    }): Promise<{
        ok: boolean;
    }>;
    handleGenericGatewayReturn(args: {
        orderId?: string;
        authority?: string | null;
        transactionRef?: string | null;
        success: boolean;
        reason?: string | null;
    }): Promise<{
        ok: boolean;
    }>;
    confirmCodPaid(orderId: string): Promise<any>;
    handleZarinpalReturn(args: {
        authority: string;
        success: boolean;
    }): Promise<{
        ok: boolean;
        verified: boolean;
        refId?: string;
        orderId?: string;
    }>;
    inquireTransaction(authority: string): Promise<any>;
    getUnverifiedTransactions(): Promise<any>;
    reverseTransaction(authority: string): Promise<any>;
    calculateFee(args: {
        amount: number;
        currency?: "IRR" | "IRT";
    }): Promise<any>;
    listTransactions(args: {
        terminalId: string;
        filter?: "PAID" | "VERIFIED" | "TRASH" | "ACTIVE" | "REFUNDED";
        offset?: number;
        limit?: number;
    }): Promise<any>;
    createZarinpalRefund(args: {
        sessionId: string;
        amount: number;
        description: string;
        method: "CARD" | "PAYA";
        reason: "CUSTOMER_REQUEST" | "DUPLICATE_TRANSACTION" | "SUSPICIOUS_TRANSACTION" | "OTHER";
    }): Promise<any>;
}
export declare const paymentService: PaymentService;
export {};
//# sourceMappingURL=payment.service.d.ts.map