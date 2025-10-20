// src/config/env.ts
// Environment loader and validator (zod). Exports a typed `env` object.
import { z } from "zod";
function bool(v, def = false) {
  if (v === undefined || v === null || v === "") return def;
  const s = String(v).toLowerCase();
  return ["1", "true", "yes", "on"].includes(s);
}
function csv(v) {
  if (!v) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).default(3000),
  APP_NAME: z.string().default("KOALAW"),
  APP_URL: z.string().url().optional(),
  // Body limits
  JSON_LIMIT: z.string().default("1mb"),
  // CORS
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  // Prisma
  PRISMA_LOG_QUERIES: z.string().optional(),
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().optional(),
  REDIS_TLS: z.string().optional(),
  // JWT & cookies
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  ACCESS_TOKEN_COOKIE_NAME: z.string().default("at"),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default("rt"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_PATH: z.string().default("/"),
  COOKIE_SECURE: z.string().optional(),
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).optional(),
  // OTP/Auth
  AUTH_OTP_DIGITS: z.coerce.number().int().optional(),
  AUTH_OTP_TTL_SEC: z.coerce.number().int().optional(),
  AUTH_OTP_MAX_ATTEMPTS: z.coerce.number().int().optional(),
  AUTH_OTP_RESEND_DELAY_SEC: z.coerce.number().int().optional(),
  AUTH_OTP_SEND_LIMIT_WINDOW_SEC: z.coerce.number().int().optional(),
  AUTH_OTP_SEND_LIMIT_PER_PHONE: z.coerce.number().int().optional(),
  AUTH_OTP_SEND_LIMIT_PER_IP: z.coerce.number().int().optional(),
  RECAPTCHA_SECRET: z.string().optional(),
  // Pricing / shipping
  PRICING_FREE_SHIP_THRESHOLD: z.coerce.number().int().optional(),
  PRICING_BASE_SHIPPING: z.coerce.number().int().optional(),
  PRICING_EXPRESS_SURCHARGE: z.coerce.number().int().optional(),
  PRICING_GIFT_WRAP_PRICE: z.coerce.number().int().optional(),
  PRICING_ENABLE_SAMPLE_COUPONS: z.string().optional(),
  CURRENCY_DEFAULT: z.string().default("IRT"),
  // Inventory
  INVENTORY_ALLOW_BACKORDER: z.string().optional(),
  // Tax
  TAX_ENABLED: z.string().optional(),
  TAX_RATE_PERCENT: z.coerce.number().optional(),
  TAX_INCLUSIVE_PRICES: z.string().optional(),
  TAX_TAXABLE_SHIPPING: z.string().optional(),
  TAX_COUNTRY_DEFAULT: z.string().default("IR"),
  TAX_REGION_OVERRIDES: z.string().optional(),
  // Email/SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  // Queue
  QUEUE_EMAIL_CONCURRENCY: z.coerce.number().optional(),
  // Payments
  ZARINPAL_MERCHANT_ID: z.string().optional(),
  ZARINPAL_SANDBOX: z.string().optional(),
  ZARINPAL_CALLBACK_URL: z.string().optional(),
  ZARINPAL_ACCESS_TOKEN: z.string().optional(),
  PAYMENT_PROVIDER: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_SECRET: z.string().optional(),
  PAYPAL_ENV: z.string().optional(),
  // S3/MinIO
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  // Elastic
  ELASTICSEARCH_NODE: z.string().optional(),
  ELASTICSEARCH_USERNAME: z.string().optional(),
  ELASTICSEARCH_PASSWORD: z.string().optional(),
  ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
  // Rate limiting (global)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().optional(),
  RATE_LIMIT_MAX: z.coerce.number().optional(),
  // Shipping
  SHIPPING_REGION_OVERRIDES: z.string().optional(),
  SHIPPING_ESTIMATED_DAYS_EXPRESS: z.string().optional(),
  SHIPPING_ESTIMATED_DAYS_STANDARD: z.string().optional(),
  //jwt
  JWT_ACCESS_TTL_SEC: z.coerce.number().optional(),
  JWT_REFRESH_TTL_SEC: z.coerce.number().optional(),
  BCRYPT_ROUNDS: z.coerce.number().optional(),
  // checkout
  ORDER_PREFIX: z.string().optional(),
});
const parsed = EnvSchema.parse(process.env);
// Derived/normalized fields
const env = {
  ...parsed,
  isDev: parsed.NODE_ENV === "development",
  isProd: parsed.NODE_ENV === "production",
  corsOrigins: csv(parsed.CORS_ALLOWED_ORIGINS),
  cookieSecure: bool(parsed.COOKIE_SECURE, parsed.NODE_ENV === "production"),
  prismaLogQueries: bool(parsed.PRISMA_LOG_QUERIES),
  smtpSecure: bool(parsed.SMTP_SECURE),
  inventoryBackorder: bool(parsed.INVENTORY_ALLOW_BACKORDER),
  taxEnabled: bool(parsed.TAX_ENABLED, true),
  taxInclusivePrices: bool(parsed.TAX_INCLUSIVE_PRICES),
  taxShipping: bool(parsed.TAX_TAXABLE_SHIPPING, true),
  pricingEnableSampleCoupons: bool(parsed.PRICING_ENABLE_SAMPLE_COUPONS, true),
  rateLimit: {
    windowMs: parsed.RATE_LIMIT_WINDOW_MS ?? 60_000,
    max: parsed.RATE_LIMIT_MAX ?? 120,
  },
  REVIEWS_AUTO_APPROVE: bool(false),
};
export { env };
export default env;
//# sourceMappingURL=env.js.map
