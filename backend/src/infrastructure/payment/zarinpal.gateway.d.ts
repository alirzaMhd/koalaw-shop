export interface ZarinpalConfig {
    merchantId: string;
    sandbox?: boolean;
    accessToken?: string;
}
export interface PaymentCreateRequest {
    amount: number;
    description: string;
    callback_url: string;
    mobile?: string;
    email?: string;
    referrer_id?: string;
    currency?: "IRR" | "IRT";
    cardPan?: string[];
    wages?: Array<{
        iban: string;
        amount: number;
        description: string;
    }>;
    metadata?: Record<string, any>;
}
export interface PaymentCreateResponse {
    code: number;
    message: string;
    authority: string;
    fee_type?: string;
    fee?: number;
}
export interface PaymentInit {
    id: string;
    authority: string;
    paymentUrl: string;
    amount: number;
    currency: string;
    fee?: number;
    feeType?: string;
}
export interface VerificationRequest {
    authority: string;
    amount: number;
}
export interface VerificationResponse {
    code: number;
    message: string;
    card_pan?: string;
    card_hash?: string;
    ref_id?: number;
    fee_type?: string;
    fee?: number;
}
export interface VerificationResult {
    success: boolean;
    refId?: string;
    cardPan?: string;
    cardHash?: string;
    fee?: number;
    feeType?: string;
    code: number;
    message?: string;
}
export interface InquiryRequest {
    authority: string;
}
export interface InquiryResponse {
    code: number;
    message: string;
    status: string;
}
export interface UnverifiedTransaction {
    authority: string;
    amount: number;
    callback_url: string;
    referer: string;
    date: string;
}
export interface UnverifiedListResponse {
    code: number;
    authorities: UnverifiedTransaction[];
}
export interface ReversalRequest {
    authority: string;
}
export interface ReversalResponse {
    code: number;
    message: string;
}
export interface RefundCreateRequest {
    sessionId: string;
    amount: number;
    description: string;
    method: "CARD" | "PAYA";
    reason: "CUSTOMER_REQUEST" | "DUPLICATE_TRANSACTION" | "SUSPICIOUS_TRANSACTION" | "OTHER";
}
export interface RefundResponse {
    id: string;
    terminal_id: string;
    amount: number;
    timeline: Record<string, any>;
    refund_amount: number;
    refund_time: string;
    refund_status: string;
}
export interface TransactionListRequest {
    terminalId: string;
    filter?: "PAID" | "VERIFIED" | "TRASH" | "ACTIVE" | "REFUNDED";
    offset?: number;
    limit?: number;
}
export interface Transaction {
    id: string;
    status: string;
    amount: number;
    description: string;
    created_at: string;
}
export interface TransactionListResponse {
    transactions: Transaction[];
    total: number;
}
export interface FeeCalculationRequest {
    amount: number;
    currency?: "IRR" | "IRT";
}
export interface FeeCalculationResponse {
    code: number;
    message: string;
    amount: number;
    fee: number;
    fee_type: string;
    suggested_amount?: string;
}
declare class ZarinpalGateway {
    private config;
    private baseUrl;
    private paymentBaseUrl;
    private advancedBaseUrl;
    private client;
    private advancedClient;
    constructor(config?: Partial<ZarinpalConfig>);
    createPayment(request: PaymentCreateRequest): Promise<PaymentInit>;
    verifyPayment(request: VerificationRequest): Promise<VerificationResult>;
    inquireTransaction(request: InquiryRequest): Promise<InquiryResponse>;
    getUnverifiedTransactions(): Promise<UnverifiedTransaction[]>;
    reverseTransaction(request: ReversalRequest): Promise<ReversalResponse>;
    createRefund(request: RefundCreateRequest): Promise<RefundResponse>;
    getRefund(refundId: string): Promise<RefundResponse>;
    listRefunds(params: {
        terminalId: string;
        limit?: number;
        offset?: number;
    }): Promise<any>;
    listTransactions(request: TransactionListRequest): Promise<TransactionListResponse>;
    calculateFee(request: FeeCalculationRequest): Promise<FeeCalculationResponse>;
    getPaymentUrl(authority: string): string;
    createPaymentIntent(args: {
        amount: number;
        currency?: string;
        metadata?: Record<string, any>;
        mobile?: string;
        email?: string;
        description?: string;
        returnUrl?: string;
    }): Promise<{
        id: string;
        authority: string;
        approvalUrl: string;
        amount: number;
        currency: string;
    }>;
    private getDefaultCallbackUrl;
}
export declare const zarinpalGateway: ZarinpalGateway;
export default zarinpalGateway;
//# sourceMappingURL=zarinpal.gateway.d.ts.map