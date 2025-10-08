// src/modules/newsletter/newsletter.service.ts
import { prisma } from "../../infrastructure/db/prismaClient.js";
import { mailer } from "../../infrastructure/mail/mailer.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../common/errors/AppError.js";
import crypto from "crypto";
import { env } from "../../config/env.js";
import { emailQueue } from "../../infrastructure/queue/bullmq.js";
const FRONTEND_URL = "koalaw.shop";
const SUPPORT_EMAIL = env.SMTP_USER || "support@koalaw.com";
/**
 * Generate secure unsubscribe token
 */
function generateUnsubscribeToken(email) {
    const secret = env.JWT_SECRET || "secret-key";
    const hash = crypto
        .createHmac("sha256", secret)
        .update(email.toLowerCase())
        .digest("hex");
    return hash.substring(0, 32);
}
/**
 * Verify unsubscribe token
 */
function verifyUnsubscribeToken(email, token) {
    const expectedToken = generateUnsubscribeToken(email);
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}
export const newsletterService = {
    /**
     * Subscribe a new email to the newsletter
     */
    async subscribe(email, source, ipAddress) {
        const normalizedEmail = email.toLowerCase().trim();
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw AppError.badRequest("فرمت ایمیل نامعتبر است.");
        }
        // Check if already subscribed
        const existing = await prisma.newsletterSubscription.findUnique({
            where: { email: normalizedEmail },
        });
        if (existing) {
            // If previously unsubscribed, re-subscribe
            if (existing.unsubscribedAt) {
                const updated = await prisma.newsletterSubscription.update({
                    where: { email: normalizedEmail },
                    data: {
                        unsubscribedAt: null,
                        consent: true,
                        source: source || existing.source,
                    },
                });
                logger.info({ email: normalizedEmail, source, ip: ipAddress }, "Newsletter re-subscription");
                // Queue welcome email
                await this.queueWelcomeEmail(updated.email);
                return { subscription: updated, isNew: false, reactivated: true };
            }
            // Already subscribed and active
            logger.info({ email: normalizedEmail }, "Already subscribed to newsletter");
            return { subscription: existing, isNew: false, reactivated: false };
        }
        // Create new subscription
        const subscription = await prisma.newsletterSubscription.create({
            data: {
                email: normalizedEmail,
                source: source || "website",
                consent: true,
            },
        });
        logger.info({ email: normalizedEmail, source, ip: ipAddress }, "New newsletter subscription");
        // Queue welcome email
        await this.queueWelcomeEmail(subscription.email);
        return { subscription, isNew: true, reactivated: false };
    },
    /**
     * Unsubscribe an email from the newsletter
     */
    async unsubscribe(email, token) {
        const normalizedEmail = email.toLowerCase().trim();
        // Verify token if provided (for one-click unsubscribe)
        if (token && !verifyUnsubscribeToken(normalizedEmail, token)) {
            throw AppError.unauthorized("توکن لغو اشتراک نامعتبر است.");
        }
        const subscription = await prisma.newsletterSubscription.findUnique({
            where: { email: normalizedEmail },
        });
        if (!subscription) {
            throw AppError.notFound("ایمیل در لیست خبرنامه یافت نشد.");
        }
        if (subscription.unsubscribedAt) {
            return { subscription, alreadyUnsubscribed: true };
        }
        const updated = await prisma.newsletterSubscription.update({
            where: { email: normalizedEmail },
            data: {
                unsubscribedAt: new Date(),
                consent: false,
            },
        });
        logger.info({ email: normalizedEmail }, "Newsletter unsubscription");
        // Queue unsubscribe confirmation email
        await this.queueUnsubscribeConfirmationEmail(updated.email);
        return { subscription: updated, alreadyUnsubscribed: false };
    },
    /**
     * Get all active subscriptions (for admin/analytics)
     */
    async getActiveSubscriptions(page = 1, perPage = 50) {
        const skip = (page - 1) * perPage;
        const [subscriptions, total] = await Promise.all([
            prisma.newsletterSubscription.findMany({
                where: { unsubscribedAt: null },
                orderBy: { createdAt: "desc" },
                skip,
                take: perPage,
            }),
            prisma.newsletterSubscription.count({
                where: { unsubscribedAt: null },
            }),
        ]);
        return {
            subscriptions,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    },
    /**
     * Get newsletter statistics
     */
    async getStatistics() {
        const [totalSubscribers, activeSubscribers, recentSubscribers] = await Promise.all([
            prisma.newsletterSubscription.count(),
            prisma.newsletterSubscription.count({
                where: { unsubscribedAt: null },
            }),
            prisma.newsletterSubscription.count({
                where: {
                    unsubscribedAt: null,
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                },
            }),
        ]);
        const unsubscribeRate = totalSubscribers > 0
            ? ((totalSubscribers - activeSubscribers) / totalSubscribers) * 100
            : 0;
        return {
            totalSubscribers,
            activeSubscribers,
            unsubscribedSubscribers: totalSubscribers - activeSubscribers,
            recentSubscribers,
            unsubscribeRate: parseFloat(unsubscribeRate.toFixed(2)),
        };
    },
    /**
     * Queue welcome email
     */
    async queueWelcomeEmail(email) {
        try {
            await emailQueue.add("newsletter-welcome", { email }, {
                attempts: 3,
                backoff: { type: "exponential", delay: 2000 },
            });
            logger.info({ email }, "Welcome email queued");
        }
        catch (error) {
            logger.error({ email, error }, "Failed to queue welcome email");
        }
    },
    /**
     * Queue unsubscribe confirmation email
     */
    async queueUnsubscribeConfirmationEmail(email) {
        try {
            await emailQueue.add("newsletter-unsubscribe", { email }, {
                attempts: 2,
                backoff: { type: "exponential", delay: 2000 },
            });
            logger.info({ email }, "Unsubscribe confirmation email queued");
        }
        catch (error) {
            logger.error({ email, error }, "Failed to queue unsubscribe email");
        }
    },
    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email) {
        const unsubscribeToken = generateUnsubscribeToken(email);
        const unsubscribeUrl = `${FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;
        const htmlContent = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf8f3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1f2937; font-size: 24px; margin-bottom: 20px; }
    .content p { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 15px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }
    .benefits { background-color: #fef2f2; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .benefits ul { margin: 10px 0; padding-right: 20px; }
    .benefits li { color: #4b5563; margin-bottom: 10px; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
    .footer a { color: #ec4899; text-decoration: none; }
    .social-links { margin: 20px 0; }
    .social-links a { display: inline-block; margin: 0 10px; color: #ec4899; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 به خانواده KOALAW خوش آمدید!</h1>
    </div>
    
    <div class="content">
      <h2>سلام عزیز! 👋</h2>
      
      <p>از اینکه به بیش از ۵۰,۰۰۰ دوست‌دار زیبایی ما پیوستید بسیار خوشحالیم!</p>
      
      <p>حالا شما اولین کسی خواهید بود که از:</p>
      
      <div class="benefits">
        <ul>
          <li>✨ کالکشن‌های جدید و محصولات منحصر به فرد</li>
          <li>🎁 پیشنهادات و تخفیف‌های انحصاری</li>
          <li>💄 نکات زیبایی و آموزش‌های تخصصی</li>
          <li>📰 جدیدترین مقالات مجله زیبایی</li>
          <li>🎉 مسابقات و جوایز ویژه</li>
        </ul>
      </div>
      
      <p>برای شروع، می‌توانید جدیدترین کالکشن‌های ما را کشف کنید:</p>
      
      <center>
        <a href="${FRONTEND_URL}/shop?featured=true" class="cta-button">مشاهده محصولات ویژه</a>
      </center>
      
      <p>اگر سوالی دارید، تیم پشتیبانی ما همیشه آماده کمک است.</p>
      
      <p style="margin-top: 30px;">با عشق،<br><strong>تیم KOALAW</strong> 💖</p>
    </div>
    
    <div class="footer">
      <div class="social-links">
        <a href="https://instagram.com/koalaw.shop">📱 اینستاگرام</a>
      </div>
      
      <p>این ایمیل به آدرس <strong>${email}</strong> ارسال شده است.</p>
      <p>اگر می‌خواهید دیگر ایمیل دریافت نکنید، می‌توانید <a href="${unsubscribeUrl}">لغو اشتراک</a> کنید.</p>
      <p style="margin-top: 20px;">© 2025 KOALAW. تمام حقوق محفوظ است.</p>
      <p>همدان، شهرک آیت‌الله مدنی</p>
    </div>
  </div>
</body>
</html>`;
        const textContent = `
به خانواده KOALAW خوش آمدید!

سلام عزیز!

از اینکه به بیش از ۵۰,۰۰۰ دوست‌دار زیبایی ما پیوستید بسیار خوشحالیم!

حالا شما اولین کسی خواهید بود که از کالکشن‌های جدید، پیشنهادات انحصاری، نکات زیبایی تخصصی، و جدیدترین مقالات مجله زیبایی باخبر می‌شوید.

برای مشاهده محصولات ویژه: ${FRONTEND_URL}/shop?featured=true

با عشق،
تیم KOALAW

---
برای لغو اشتراک: ${unsubscribeUrl}
`;
        try {
            await mailer.sendMail({
                to: email,
                subject: "🎉 به خانواده KOALAW خوش آمدید!",
                html: htmlContent,
                text: textContent,
                headers: {
                    "List-Unsubscribe": `<${unsubscribeUrl}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                },
            });
            logger.info({ email }, "Welcome email sent successfully");
            return { sent: true };
        }
        catch (error) {
            logger.error({ email, error }, "Failed to send welcome email");
            throw error;
        }
    },
    /**
     * Send unsubscribe confirmation email
     */
    async sendUnsubscribeConfirmationEmail(email) {
        const resubscribeUrl = `${FRONTEND_URL}/#newsletter`;
        const htmlContent = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf8f3; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #f3f4f6; padding: 40px 20px; text-align: center; }
    .header h1 { color: #1f2937; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .content p { color: #4b5563; font-size: 16px; line-height: 1.8; margin-bottom: 15px; }
    .cta-button { display: inline-block; background-color: #ec4899; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>😢 متأسفیم که می‌روید</h1>
    </div>
    
    <div class="content">
      <p>با موفقیت از خبرنامه KOALAW لغو اشتراک شدید.</p>
      
      <p>دیگر ایمیل‌های تبلیغاتی و خبرنامه دریافت نخواهید کرد. (ایمیل‌های مربوط به سفارشات همچنان ارسال می‌شوند)</p>
      
      <p>اگر اشتباهی لغو اشتراک کرده‌اید یا نظرتان عوض شد، می‌توانید دوباره عضو شوید:</p>
      
      <center>
        <a href="${resubscribeUrl}" class="cta-button">عضویت مجدد</a>
      </center>
      
      <p>ما همیشه برای خدمت‌رسانی به شما آماده هستیم.</p>
      
      <p style="margin-top: 30px;">با احترام،<br><strong>تیم KOALAW</strong></p>
    </div>
    
    <div class="footer">
      <p>© 2025 KOALAW. تمام حقوق محفوظ است.</p>
    </div>
  </div>
</body>
</html>`;
        const textContent = `
متأسفیم که می‌روید

با موفقیت از خبرنامه KOALAW لغو اشتراک شدید.

دیگر ایمیل‌های تبلیغاتی و خبرنامه دریافت نخواهید کرد.

برای عضویت مجدد: ${resubscribeUrl}

با احترام،
تیم KOALAW
`;
        try {
            await mailer.sendMail({
                to: email,
                subject: "تأیید لغو اشتراک از خبرنامه KOALAW",
                html: htmlContent,
                text: textContent,
            });
            logger.info({ email }, "Unsubscribe confirmation email sent successfully");
            return { sent: true };
        }
        catch (error) {
            logger.error({ email, error }, "Failed to send unsubscribe confirmation email");
            throw error;
        }
    },
    /**
     * Send newsletter to all active subscribers
     */
    async sendNewsletter(opts) {
        const { subject, htmlContent, textContent, testEmail, scheduledAt } = opts;
        if (testEmail) {
            // Send test email
            const unsubscribeToken = generateUnsubscribeToken(testEmail);
            const unsubscribeUrl = `${FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(testEmail)}&token=${unsubscribeToken}`;
            const finalHtml = htmlContent + `
        <div style="margin-top: 40px; padding: 20px; background-color: #fef2f2; border-radius: 10px; text-align: center;">
          <p style="color: #991b1b; font-weight: bold;">⚠️ این یک ایمیل تستی است</p>
          <p style="color: #6b7280; font-size: 14px;"><a href="${unsubscribeUrl}">لغو اشتراک</a></p>
        </div>`;
            await mailer.sendMail({
                to: testEmail,
                subject: `[TEST] ${subject}`,
                html: finalHtml,
                text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
            });
            logger.info({ testEmail }, "Test newsletter sent");
            return { sent: 1, recipients: [testEmail], test: true };
        }
        // Get all active subscribers
        const subscriptions = await prisma.newsletterSubscription.findMany({
            where: { unsubscribedAt: null },
            select: { email: true },
        });
        if (subscriptions.length === 0) {
            throw AppError.badRequest("هیچ مشترکی یافت نشد.");
        }
        logger.info({ count: subscriptions.length }, "Sending newsletter to all subscribers");
        // Queue emails in batches
        const batchSize = 100;
        for (let i = 0; i < subscriptions.length; i += batchSize) {
            const batch = subscriptions.slice(i, i + batchSize);
            for (const sub of batch) {
                await emailQueue.add("newsletter-broadcast", {
                    email: sub.email,
                    subject,
                    htmlContent,
                    textContent,
                }, {
                    attempts: 3,
                    backoff: { type: "exponential", delay: 5000 },
                    delay: scheduledAt ? scheduledAt.getTime() - Date.now() : 0,
                });
            }
            logger.info({ batch: Math.floor(i / batchSize) + 1, emails: batch.length }, "Newsletter batch queued");
        }
        return {
            sent: subscriptions.length,
            recipients: subscriptions.map((s) => s.email),
            test: false,
            queued: true,
        };
    },
    /**
     * Send individual newsletter email (called by queue worker)
     */
    async sendNewsletterEmail(opts) {
        const { email, subject, htmlContent, textContent } = opts;
        const unsubscribeToken = generateUnsubscribeToken(email);
        const unsubscribeUrl = `${FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;
        const footerHtml = `
      <div style="margin-top: 40px; padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
          این ایمیل به آدرس <strong>${email}</strong> ارسال شده است.
        </p>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
          <a href="${unsubscribeUrl}" style="color: #ec4899; text-decoration: none;">لغو اشتراک</a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">© 2025 KOALAW. تمام حقوق محفوظ است.</p>
      </div>`;
        const finalHtml = htmlContent + footerHtml;
        await mailer.sendMail({
            to: email,
            subject,
            html: finalHtml,
            text: textContent || htmlContent.replace(/<[^>]*>/g, ""),
            headers: {
                "List-Unsubscribe": `<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
        });
        logger.info({ email }, "Newsletter email sent");
    },
    /**
     * Export subscribers to CSV
     */
    async exportSubscribers() {
        const subscriptions = await prisma.newsletterSubscription.findMany({
            where: { unsubscribedAt: null },
            orderBy: { createdAt: "desc" },
        });
        const csv = [
            "Email,Source,Created At",
            ...subscriptions.map((s) => `${s.email},${s.source || ""},${s.createdAt.toISOString()}`),
        ].join("\n");
        return csv;
    },
};
export default newsletterService;
//# sourceMappingURL=newsletter.service.js.map