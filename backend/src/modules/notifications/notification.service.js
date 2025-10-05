// src/modules/notifications/notification.service.ts
// Notification orchestration: email/SMS/push helpers + event-driven messages
// (order confirmation, payment receipt, shipping updates).
//
// Integrations used (all optional with graceful fallbacks):
// - Mail: ../../infrastructure/mail/mailer (Nodemailer or provider SDK)
// - Queue: ../../infrastructure/queue/bullmq (BullMQ) to enqueue background email jobs
// - Templates: ../../infrastructure/mail/templates (Handlebars/MJML optional)
// - SMS: ../../infrastructure/sms/provider (your custom adapter) — optional
//
// Also binds to domain events (order.created, payment.succeeded) if bindDefaultHandlers() is called.
import path from "path";
import fs from "fs/promises";
import Handlebars from "handlebars";
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../common/errors/AppError.js";
import { eventBus } from "../../events/eventBus.js";
import { onOrderCreated, onPaymentSucceeded } from "../orders/order.events.js";
// Optional dynamic modules
let mailer = null;
try {
    // expects something like: export const mailer = { sendMail: async (opts) => ... }
    // or default export nodemailer transporter
    // We'll normalize to a sendMail(payload) function below.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const m = require("../../infrastructure/mail/mailer");
    mailer = m?.mailer || m?.default || m;
}
catch (e) {
    logger.warn("Mailer not configured. Emails will be logged only.");
}
let queues = null;
try {
    // expects: export const emailQueue = new Queue(...), or export const queues = { email: Queue }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const q = require("../../infrastructure/queue/bullmq");
    queues = q?.queues || q;
}
catch (e) {
    // queue is optional; we will send inline if missing
}
let smsProvider = null;
try {
    // your custom adapter, e.g., Kavenegar/Twilio wrapper
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const s = require("../../infrastructure/sms/provider");
    smsProvider = s?.smsProvider || s?.default || s;
}
catch (e) {
    // optional
}
const APP_NAME = env.APP_NAME || "KOALAW";
const MAIL_FROM = env.MAIL_FROM || `no-reply@${(env.APP_URL || "example.com").replace(/^https?:\/\//, "")}`;
// Paths for templates
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEMPLATE_DIR = path.resolve(__dirname, "../../infrastructure/mail/templates");
// ---------------- Utility helpers ----------------
function money(n, currency) {
    try {
        // Amounts stored as integer TOMAN in this project. Adjust if you use Rial.
        return `${Number(n || 0).toLocaleString("fa-IR")} تومان`;
    }
    catch {
        return `${n} ${currency || ""}`.trim();
    }
}
function safeStr(s) {
    return (s || "").toString();
}
async function readTemplateFile(name) {
    // Supports .hbs or .html (first match)
    const candidates = [`${name}.hbs`, `${name}.html`];
    for (const file of candidates) {
        try {
            const full = path.join(TEMPLATE_DIR, file);
            const exists = await fs
                .access(full)
                .then(() => true)
                .catch(() => false);
            if (exists) {
                return await fs.readFile(full, "utf8");
            }
        }
        catch {
            // ignore
        }
    }
    return null;
}
async function renderTemplate(name, data) {
    try {
        const raw = await readTemplateFile(name);
        if (raw) {
            const tpl = Handlebars.compile(raw);
            const html = tpl(data);
            // Extract text quickly by stripping tags (optional)
            const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            return { html, text };
        }
    }
    catch (e) {
        logger.warn({ err: e, name }, "Template rendering failed; falling back to inline template.");
    }
    // Fallback inline minimal template (RTL-friendly)
    const title = data.subject || data.title || APP_NAME;
    const lines = Array.isArray(data.items)
        ? data.items
            .map((it) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${safeStr(it.title)} ${it.variantName ? `(${it.variantName})` : ""}</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${it.qty}×</td><td style="padding:6px 8px;border-bottom:1px solid #eee">${money(it.lineTotal, data.amounts?.currencyCode || "IRR")}</td></tr>`)
            .join("")
        : "";
    const amounts = data.amounts || {};
    const html = `
  <div dir="rtl" style="font-family:Tahoma,Segoe UI,Arial,sans-serif;background:#faf8f3;padding:16px">
    <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #eee">
      <div style="padding:16px 20px;background:#111;color:#fff">
        <h2 style="margin:0;font-size:18px">${APP_NAME}</h2>
      </div>
      <div style="padding:16px 20px">
        <h3 style="margin-top:0">${title}</h3>
        ${data.greeting ? `<p>${data.greeting}</p>` : ""}
        ${Array.isArray(data.items) ? `<table style="width:100%;border-collapse:collapse"><tbody>${lines}</tbody></table>` : ""}
        ${amounts.total != null
        ? `<div style="margin-top:12px;border-top:1px dashed #ddd;padding-top:8px">
                <div>جمع جزء: <strong>${money(amounts.subtotal || 0, amounts.currencyCode || "IRR")}</strong></div>
                <div>تخفیف: <strong>${money(amounts.discount || 0, amounts.currencyCode || "IRR")}</strong></div>
                <div>هزینه ارسال: <strong>${money(amounts.shipping || 0, amounts.currencyCode || "IRR")}</strong></div>
                ${amounts.giftWrap ? `<div>بسته‌بندی هدیه: <strong>${money(amounts.giftWrap, amounts.currencyCode || "IRR")}</strong></div>` : ""}
                <div style="margin-top:6px">مبلغ نهایی: <strong>${money(amounts.total, amounts.currencyCode || "IRR")}</strong></div>
              </div>`
        : ""}
      </div>
      <div style="padding:12px 20px;color:#666;font-size:12px;border-top:1px solid #eee">
        <div>${APP_NAME}</div>
        <div><a href="${env.APP_URL || "#"}" style="color:#666;text-decoration:none">${env.APP_URL || ""}</a></div>
      </div>
    </div>
  </div>`;
    const text = `${title} - مبلغ: ${money(amounts.total || 0, amounts.currencyCode || "IRR")}`;
    return { html, text };
}
async function sendViaMailer(payload) {
    if (!mailer) {
        logger.info({ to: payload.to, subject: payload.subject }, "Mailer missing. Logging email payload:");
        logger.info({ html: payload.html, text: payload.text });
        return;
    }
    // Normalize to something like nodemailer transporter
    if (typeof mailer.sendMail === "function") {
        await mailer.sendMail({
            from: payload.from || MAIL_FROM,
            to: payload.to,
            cc: payload.cc,
            bcc: payload.bcc,
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
            headers: payload.headers,
        });
    }
    else if (typeof mailer.send === "function") {
        await mailer.send({ ...payload, from: payload.from || MAIL_FROM });
    }
    else {
        logger.warn("Mailer module does not expose sendMail/send. Email not sent.");
    }
}
async function enqueueEmailJob(payload) {
    try {
        const q = queues?.email || queues?.mailer || queues?.default;
        if (!q || typeof q.add !== "function")
            return false;
        await q.add("email.send", payload, { removeOnComplete: true, removeOnFail: true });
        return true;
    }
    catch (e) {
        logger.warn({ err: e }, "Failed to enqueue email; falling back to direct send.");
        return false;
    }
}
// ---------------- Service ----------------
class NotificationService {
    /**
     * Send an email now or enqueue it if a queue is configured.
     * If templateName is provided, we render it using Handlebars templates.
     */
    async sendEmail(payload, opts) {
        let rendered = { html: payload.html || "", text: payload.text || "" };
        if (payload.templateName) {
            // renderTemplate returns { html: string; text?: string } so keep text optional here
            rendered = await renderTemplate(payload.templateName, { ...(payload.templateData || {}), subject: payload.subject });
        }
        // Remove template-specific props and ensure html/text are definite strings to satisfy strict optional property typing
        const { templateName, templateData, ...rest } = payload;
        const final = {
            ...rest,
            from: rest.from || MAIL_FROM,
            html: rendered.html ?? rest.html ?? "",
            text: rendered.text ?? rest.text ?? "",
        };
        if (opts?.enqueue) {
            const enq = await enqueueEmailJob(final);
            if (enq)
                return;
        }
        await sendViaMailer(final);
    }
    /**
     * Send SMS (if provider exists).
     */
    async sendSms(payload) {
        if (!smsProvider || typeof smsProvider.send !== "function") {
            logger.info({ to: payload.to, text: payload.text }, "SMS provider missing. Logging SMS payload.");
            return;
        }
        await smsProvider.send(payload);
    }
    // ---------- Domain notifications ----------
    /**
     * Build and send order confirmation email by orderId (or from event).
     */
    async sendOrderConfirmation(orderId) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { orderBy: { position: "asc" } },
                // Attempt to fetch user email if available
                user: { select: { email: true, firstName: true, lastName: true, phone: true } },
            },
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        const toEmail = order.user?.email || null;
        if (!toEmail) {
            // No email available; you may send SMS instead
            logger.info({ orderId }, "Order confirmation email skipped (no user email).");
            return;
        }
        const name = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ").trim() || null;
        const ctx = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            name,
            amounts: {
                subtotal: order.subtotal,
                discount: order.discountTotal,
                shipping: order.shippingTotal,
                giftWrap: order.giftWrapTotal,
                total: order.total,
                currencyCode: order.currencyCode,
            },
            items: order.items.map((it) => ({
                title: it.title,
                variantName: it.variantName,
                qty: it.quantity,
                unitPrice: it.unitPrice,
                lineTotal: it.lineTotal,
                imageUrl: it.imageUrl,
            })),
            shipping: {
                method: order.shippingMethod,
                province: order.shippingProvince ?? null,
                city: order.shippingCity ?? null,
                addressLine1: order.shippingAddressLine1 ?? null,
                postalCode: order.shippingPostalCode ?? null,
            },
            couponCode: order.couponCode || null,
        };
        await this.sendEmail({
            to: toEmail,
            subject: `تایید سفارش ${order.orderNumber}`,
            templateName: "orderConfirmation",
            templateData: {
                ...ctx,
                greeting: name ? `${name} عزیز، سفارش شما ثبت شد.` : "سفارش شما ثبت شد.",
                title: "تایید سفارش",
            },
        }, { enqueue: true });
    }
    /**
     * Build and send payment receipt email by orderId/paymentId.
     */
    async sendPaymentReceipt(orderId, paymentId) {
        const [order, payment] = await Promise.all([
            prisma.order.findUnique({
                where: { id: orderId },
                include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
            }),
            prisma.payment.findUnique({ where: { id: paymentId } }),
        ]);
        if (!order || !payment)
            throw new AppError("سفارش/پرداخت یافت نشد.", 404, "NOT_FOUND");
        const toEmail = order.user?.email || null;
        if (!toEmail) {
            logger.info({ orderId }, "Payment receipt email skipped (no user email).");
            return;
        }
        const name = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ").trim() || null;
        const ctx = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            name,
            amounts: {
                subtotal: order.subtotal,
                discount: order.discountTotal,
                shipping: order.shippingTotal,
                giftWrap: order.giftWrapTotal,
                total: order.total,
                currencyCode: order.currencyCode,
            },
            items: order.items.map((it) => ({
                title: it.title,
                variantName: it.variantName,
                qty: it.quantity,
                unitPrice: it.unitPrice,
                lineTotal: it.lineTotal,
            })),
            shipping: {
                method: order.shippingMethod,
                province: order.shippingProvince ?? null,
                city: order.shippingCity ?? null,
                addressLine1: order.shippingAddressLine1 ?? null,
                postalCode: order.shippingPostalCode ?? null,
            },
            couponCode: order.couponCode || null,
        };
        await this.sendEmail({
            to: toEmail,
            subject: `رسید پرداخت سفارش ${order.orderNumber}`,
            templateName: "paymentReceipt",
            templateData: {
                ...ctx,
                payment,
                title: "رسید پرداخت",
                greeting: name ? `${name} عزیز، پرداخت شما با موفقیت انجام شد.` : "پرداخت شما با موفقیت انجام شد.",
            },
        }, { enqueue: true });
    }
    /**
     * Shipping update via email (tracking number, carrier, etc.)
     */
    async sendShippingUpdate(orderId, args) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: { select: { email: true, firstName: true, lastName: true } } },
        });
        if (!order)
            throw new AppError("سفارش یافت نشد.", 404, "ORDER_NOT_FOUND");
        const toEmail = order.user?.email || null;
        if (!toEmail) {
            logger.info({ orderId }, "Shipping update email skipped (no user email).");
            return;
        }
        const name = [order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ").trim() || null;
        await this.sendEmail({
            to: toEmail,
            subject: `بروزرسانی ارسال سفارش ${order.orderNumber}`,
            templateName: "shippingUpdate",
            templateData: {
                orderNumber: order.orderNumber,
                carrier: args.carrier,
                trackingNumber: args.trackingNumber,
                labelUrl: args.labelUrl || null,
                greeting: name ? `${name} عزیز، سفارش شما در حال ارسال است.` : "سفارش شما در حال ارسال است.",
                title: "بروزرسانی ارسال",
            },
        }, { enqueue: true });
    }
    // ---------- Event bindings ----------
    bindDefaultHandlers() {
        onOrderCreated((evt) => {
            this.sendOrderConfirmation(evt.orderId).catch((e) => logger.warn({ err: e, orderId: evt.orderId }, "Failed to send order confirmation"));
        });
        onPaymentSucceeded((evt) => {
            this.sendPaymentReceipt(evt.orderId, evt.paymentId).catch((e) => logger.warn({ err: e, orderId: evt.orderId, paymentId: evt.paymentId }, "Failed to send payment receipt"));
        });
        logger.info("Notification default event handlers bound.");
    }
}
export const notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map