// src/infrastructure/payment/zarinpal.gateway.ts
// Zarinpal payment gateway adapter for Iranian payments
// Official API Docs: https://docs.zarinpal.com/paymentGateway/

import axios, { type AxiosInstance } from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../common/errors/AppError.js";

// ==================== Types ====================

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

// ==================== Error Codes ====================

const ZARINPAL_ERRORS: Record<number, string> = {
  [-1]: "اطلاعات ارسال شده ناقص است.",
  [-2]: "IP یا مرچنت کد پذیرنده صحیح نیست.",
  [-3]: "مبلغ باید بیشتر از 10,000 ریال باشد.",
  [-4]: "سطح تایید پذیرنده پایین‌تر از سطح نقره‌ای است.",
  [-11]: "درخواست مورد نظر یافت نشد.",
  [-12]: "امکان ویرایش درخواست میسر نمی‌باشد.",
  [-21]: "هیچ نوع عملیات مالی برای این تراکنش یافت نشد.",
  [-22]: "تراکنش ناموفق می‌باشد.",
  [-33]: "رقم تراکنش با رقم پرداخت شده مطابقت ندارد.",
  [-34]: "سقف تقسیم تراکنش از لحاظ تعداد یا رقم عبور کرده است.",
  [-40]: "اجازه دسترسی به متد مربوطه وجود ندارد.",
  [-41]: "اطلاعات ارسال شده مربوط به AdditionalData غیرمعتبر است.",
  [-42]: "مدت زمان معتبر طول عمر شناسه پرداخت باید بین 30 دقیقه تا 45 روز باشد.",
  [-54]: "درخواست مورد نظر آرشیو شده است.",
  100: "عملیات موفق بود.",
  101: "عملیات پرداخت موفق بوده و قبلا وریفای شده است.",
};

// ==================== Constants ====================

const ZARINPAL_API_URL = "https://payment.zarinpal.com/pg/v4/payment";
const ZARINPAL_SANDBOX_API_URL = "https://sandbox.zarinpal.com/pg/v4/payment";
const ZARINPAL_PAYMENT_URL = "https://payment.zarinpal.com/pg/StartPay";
const ZARINPAL_SANDBOX_PAYMENT_URL = "https://sandbox.zarinpal.com/pg/StartPay";
const ZARINPAL_ADVANCED_API_URL = "https://api.zarinpal.com";
const ZARINPAL_SANDBOX_ADVANCED_API_URL = "https://sandbox.zarinpal.com";

// ==================== Gateway Class ====================

class ZarinpalGateway {
  private config: Required<ZarinpalConfig>;
  private baseUrl: string;
  private paymentBaseUrl: string;
  private advancedBaseUrl: string;
  private client: AxiosInstance;
  private advancedClient: AxiosInstance;

  constructor(config?: Partial<ZarinpalConfig>) {
    const merchantId = config?.merchantId || env.ZARINPAL_MERCHANT_ID?.toString() || "";
    const sandbox = config?.sandbox ?? (env.ZARINPAL_SANDBOX === "true");
    const accessToken = config?.accessToken || env.ZARINPAL_ACCESS_TOKEN?.toString() || "";

    if (!merchantId) {
      throw new Error("ZARINPAL_MERCHANT_ID is required in environment variables");
    }

    this.config = { merchantId, sandbox, accessToken };
    this.baseUrl = sandbox ? ZARINPAL_SANDBOX_API_URL : ZARINPAL_API_URL;
    this.paymentBaseUrl = sandbox ? ZARINPAL_SANDBOX_PAYMENT_URL : ZARINPAL_PAYMENT_URL;
    this.advancedBaseUrl = sandbox ? ZARINPAL_SANDBOX_ADVANCED_API_URL : ZARINPAL_ADVANCED_API_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.advancedClient = axios.create({
      baseURL: this.advancedBaseUrl,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    logger.info(
      { merchantId: merchantId.slice(0, 8) + "***", sandbox },
      "Zarinpal gateway initialized"
    );
  }

  // ==================== Payment Methods ====================

  async createPayment(request: PaymentCreateRequest): Promise<PaymentInit> {
    const { metadata, ...zarinpalRequest } = request;

    const minAmount = request.currency === "IRT" ? 1000 : 10000;
    if (request.amount < minAmount) {
      throw new AppError(
        `مبلغ باید بیشتر از ${minAmount.toLocaleString()} ${request.currency === "IRT" ? "تومان" : "ریال"} باشد.`,
        400,
        "AMOUNT_TOO_LOW"
      );
    }

    try {
      const payload = {
        merchant_id: this.config.merchantId,
        amount: Math.floor(request.amount),
        description: request.description.substring(0, 255),
        callback_url: request.callback_url,
        ...(request.mobile && { mobile: request.mobile }),
        ...(request.email && { email: request.email }),
        ...(request.referrer_id && { referrer_id: request.referrer_id }),
        ...(request.currency && { currency: request.currency }),
        ...(request.cardPan && { cardPan: request.cardPan }),
        ...(request.wages && { wages: request.wages }),
      };

      logger.debug({ payload }, "Zarinpal payment request");

      const response = await this.client.post<{
        code?: number;
        message?: string;
        errors?: any[];
        data?: {
          code?: number;           // ← ADD THIS
          message?: string;
          authority?: string;
          fee?: number;
          fee_type?: string;
        };
      }>(
        "/request.json",
        payload
      );

const responseData = response.data;
const errors = responseData?.errors;
const data = responseData?.data;
const code = data?.code || -1; // ← code is INSIDE data object

// Check if request was successful (code 100)
if (code !== 100 || !data?.authority) {
  const message = ZARINPAL_ERRORS[code] || data?.message || "خطای ناشناخته زرین‌پال";
  logger.error({ code, message, errors, data, responseData }, "Zarinpal request failed");
  throw new AppError(`${message} (کد خطا: ${code})`, 400, "ZARINPAL_ERROR");
}

      const authority = data.authority;


      if (!authority) {
        throw new AppError("Authority code not received from Zarinpal", 500, "ZARINPAL_NO_AUTHORITY");
      }

      const paymentUrl = `${this.paymentBaseUrl}/${authority}`;

      logger.info({ authority, amount: request.amount }, "Zarinpal payment created");

      return {
        id: authority,
        authority,
        paymentUrl,
        amount: request.amount,
        currency: request.currency || "IRR",
        fee: data.fee,
        feeType: data.fee_type,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const msg = error?.response?.data?.errors?.message || error?.message || "خطا در ارتباط با زرین‌پال";
      logger.error({ err: error, response: error?.response?.data }, "Zarinpal API error");
      throw new AppError(msg, 500, "ZARINPAL_API_ERROR");
    }
  }

  async verifyPayment(request: VerificationRequest): Promise<VerificationResult> {
    const { authority, amount } = request;

    if (!authority) {
      throw new AppError("Authority is required for verification", 400, "MISSING_AUTHORITY");
    }

    if (!amount || amount < 10000) {
      throw new AppError("Amount must be provided and match original request", 400, "INVALID_AMOUNT");
    }

    try {
      const payload = {
        merchant_id: this.config.merchantId,
        amount: Math.floor(amount),
        authority,
      };

      logger.debug({ payload }, "Zarinpal verify request");

      const response = await this.client.post<{
        code?: number;
        message?: string;
        errors?: any[];
        data?: {
          code?: number;           // ← ADD THIS
          message?: string;        // ← ADD THIS
          card_pan?: string;
          card_hash?: string;
          ref_id?: number;
          fee_type?: string;
          fee?: number;
        };
      }>(
        "/verify.json",
        payload
      );

      const responseData = response.data;
      const errors = responseData?.errors;
      const data = responseData?.data;
      const code = data?.code || -1;

      if (code !== 100 && code !== 101) {
        const message = ZARINPAL_ERRORS[code] || responseData?.message || "تراکنش ناموفق بود.";
        logger.warn({ code, message, authority }, "Zarinpal verification unsuccessful");
        return { success: false, code, message };
      }

      logger.info({ authority, refId: data?.ref_id, code: code }, "Zarinpal payment verified");

      return {
        success: true,
        code,
        refId: data?.ref_id ? String(data.ref_id) : undefined,
        cardPan: data?.card_pan,
        cardHash: data?.card_hash,
        fee: data?.fee,
        feeType: data?.fee_type,
      };
    } catch (error: any) {
      const msg = error?.response?.data?.errors?.message || error?.message || "خطا در تایید پرداخت";
      logger.error({ err: error, authority }, "Zarinpal verify API error");
      throw new AppError(msg, 500, "ZARINPAL_VERIFY_ERROR");
    }
  }

  async inquireTransaction(request: InquiryRequest): Promise<InquiryResponse> {
    const { authority } = request;

    if (!authority) {
      throw new AppError("Authority is required for inquiry", 400, "MISSING_AUTHORITY");
    }

    try {
      const payload = {
        merchant_id: this.config.merchantId,
        authority,
      };

      const response = await this.client.post<{ data?: InquiryResponse; errors?: any }>(
        "/inquiry.json",
        payload
      );

      const data = response.data?.data;
      const errors = response.data?.errors;

      if (errors || !data) {
        const code = errors?.code || -1;
        const message = ZARINPAL_ERRORS[code] || errors?.message || "خطای استعلام تراکنش";
        throw new AppError(`${message} (کد خطا: ${code})`, 400, "ZARINPAL_ERROR");
      }

      logger.info({ authority, status: data.status }, "Zarinpal inquiry result");
      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const msg = error?.response?.data?.errors?.message || error?.message || "خطا در استعلام تراکنش";
      logger.error({ err: error, authority }, "Zarinpal inquiry API error");
      throw new AppError(msg, 500, "ZARINPAL_INQUIRY_ERROR");
    }
  }

  async getUnverifiedTransactions(): Promise<UnverifiedTransaction[]> {
    try {
      const payload = {
        merchant_id: this.config.merchantId,
      };

      const response = await this.client.post<{ data?: UnverifiedListResponse; errors?: any }>(
        "/unVerified.json",
        payload
      );

      const data = response.data?.data;
      const errors = response.data?.errors;

      if (errors || !data) {
        const code = errors?.code || -1;
        const message = ZARINPAL_ERRORS[code] || errors?.message || "خطای دریافت لیست تراکنش‌ها";
        throw new AppError(`${message} (کد خطا: ${code})`, 400, "ZARINPAL_ERROR");
      }

      logger.info({ count: data.authorities?.length || 0 }, "Zarinpal unverified transactions fetched");
      return data.authorities || [];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const msg = error?.response?.data?.errors?.message || error?.message || "خطا در دریافت تراکنش‌های تأیید نشده";
      logger.error({ err: error }, "Zarinpal unverified API error");
      throw new AppError(msg, 500, "ZARINPAL_UNVERIFIED_ERROR");
    }
  }

  async reverseTransaction(request: ReversalRequest): Promise<ReversalResponse> {
    const { authority } = request;

    if (!authority) {
      throw new AppError("Authority is required for reversal", 400, "MISSING_AUTHORITY");
    }

    try {
      const payload = {
        merchant_id: this.config.merchantId,
        authority,
      };

      const response = await this.client.post<{ data?: ReversalResponse; errors?: any }>(
        "/reverse.json",
        payload
      );

      const data = response.data?.data;
      const errors = response.data?.errors;

      if (errors || !data || data.code !== 100) {
        const code = errors?.code || data?.code || -1;
        const message = ZARINPAL_ERRORS[code] || errors?.message || data?.message || "خطای ریورس تراکنش";
        throw new AppError(`${message} (کد خطا: ${code})`, 400, "ZARINPAL_ERROR");
      }

      logger.info({ authority }, "Zarinpal transaction reversed");
      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const msg = error?.response?.data?.errors?.message || error?.message || "خطا در ریورس تراکنش";
      logger.error({ err: error, authority }, "Zarinpal reverse API error");
      throw new AppError(msg, 500, "ZARINPAL_REVERSE_ERROR");
    }
  }

  async createRefund(request: RefundCreateRequest): Promise<RefundResponse> {
    if (!this.config.accessToken) {
      throw new AppError("Access token is required for refund operations", 400, "MISSING_ACCESS_TOKEN");
    }

    if (request.amount < 20000) {
      throw new AppError("حداقل مبلغ قابل استرداد 20,000 ریال است.", 400, "REFUND_AMOUNT_TOO_LOW");
    }

    try {
      const payload = {
        session_id: request.sessionId,
        amount: Math.floor(request.amount),
        description: request.description,
        method: request.method,
        reason: request.reason,
      };

      const response = await this.advancedClient.post<RefundResponse>("/api/v1/refunds", payload);

      logger.info({ sessionId: request.sessionId, amount: request.amount }, "Zarinpal refund created");
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "خطا در ایجاد استرداد";
      logger.error({ err: error, request }, "Zarinpal refund API error");
      throw new AppError(msg, 500, "ZARINPAL_REFUND_ERROR");
    }
  }

  async getRefund(refundId: string): Promise<RefundResponse> {
    if (!this.config.accessToken) {
      throw new AppError("Access token is required for refund operations", 400, "MISSING_ACCESS_TOKEN");
    }

    try {
      const response = await this.advancedClient.get<RefundResponse>(`/api/v1/refunds/${refundId}`);
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "خطا در دریافت اطلاعات استرداد";
      logger.error({ err: error, refundId }, "Zarinpal get refund API error");
      throw new AppError(msg, 500, "ZARINPAL_REFUND_ERROR");
    }
  }

  async listRefunds(params: { terminalId: string; limit?: number; offset?: number }): Promise<any> {
    if (!this.config.accessToken) {
      throw new AppError("Access token is required for refund operations", 400, "MISSING_ACCESS_TOKEN");
    }

    try {
      const response = await this.advancedClient.get("/api/v1/refunds", { params });
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "خطا در دریافت لیست استرداد‌ها";
      logger.error({ err: error }, "Zarinpal list refunds API error");
      throw new AppError(msg, 500, "ZARINPAL_REFUND_ERROR");
    }
  }

  async listTransactions(request: TransactionListRequest): Promise<TransactionListResponse> {
    if (!this.config.accessToken) {
      throw new AppError("Access token is required for transaction list", 400, "MISSING_ACCESS_TOKEN");
    }

    try {
      const params = {
        terminal_id: request.terminalId,
        ...(request.filter && { filter: request.filter }),
        ...(request.offset !== undefined && { offset: request.offset }),
        ...(request.limit !== undefined && { limit: request.limit }),
      };

      const response = await this.advancedClient.get<TransactionListResponse>("/api/v1/transactions", { params });
      return response.data;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "خطا در دریافت لیست تراکنش‌ها";
      logger.error({ err: error }, "Zarinpal list transactions API error");
      throw new AppError(msg, 500, "ZARINPAL_TRANSACTIONS_ERROR");
    }
  }

  async calculateFee(request: FeeCalculationRequest): Promise<FeeCalculationResponse> {
    try {
      const payload = {
        merchant_id: this.config.merchantId,
        amount: Math.floor(request.amount),
        ...(request.currency && { currency: request.currency }),
      };

      const response = await this.client.post<{ data?: FeeCalculationResponse; errors?: any }>(
        "/feeCalculation.json",
        payload
      );

      const data = response.data?.data;
      const errors = response.data?.errors;

      if (errors || !data || data.code !== 100) {
        const code = errors?.code || data?.code || -1;
        const message = ZARINPAL_ERRORS[code] || errors?.message || data?.message || "خطای محاسبه کارمزد";
        throw new AppError(`${message} (کد خطا: ${code})`, 400, "ZARINPAL_ERROR");
      }

      logger.info({ amount: data.amount, fee: data.fee, feeType: data.fee_type }, "Zarinpal fee calculated");
      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const msg = error?.response?.data?.errors?.message || error?.message || "خطا در محاسبه کارمزد";
      logger.error({ err: error }, "Zarinpal fee calculation API error");
      throw new AppError(msg, 500, "ZARINPAL_FEE_ERROR");
    }
  }

  getPaymentUrl(authority: string): string {
    return `${this.paymentBaseUrl}/${authority}`;
  }

  async createPaymentIntent(args: {
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
  }> {
    const orderId = args.metadata?.orderId || "";
    const orderNumber = args.metadata?.orderNumber || "";
    const description = args.description || `پرداخت سفارش ${orderNumber || orderId}`;
    const currency: "IRR" | "IRT" = args.currency === "IRT" ? "IRT" : "IRR";

    const result = await this.createPayment({
      amount: args.amount,
      description,
      callback_url: args.returnUrl || this.getDefaultCallbackUrl(),
      mobile: args.mobile,
      email: args.email,
      currency,
      metadata: args.metadata,
    });

    return {
      id: result.authority,
      authority: result.authority,
      approvalUrl: result.paymentUrl,
      amount: result.amount,
      currency: result.currency,
    };
  }

  private getDefaultCallbackUrl(): string {
    return env.ZARINPAL_CALLBACK_URL?.toString() || `${env.APP_URL}/payments/zarinpal/return`;
  }
}

export const zarinpalGateway = new ZarinpalGateway();
export default zarinpalGateway;