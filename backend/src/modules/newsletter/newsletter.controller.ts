// src/modules/newsletter/newsletter.controller.ts
import type { RequestHandler } from "express";
import { newsletterService } from "./newsletter.service.js";
import { AppError } from "../../common/errors/AppError.js";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("فرمت ایمیل نامعتبر است."),
  source: z.string().optional(),
});

const unsubscribeSchema = z.object({
  email: z.string().email("فرمت ایمیل نامعتبر است."),
  token: z.string().optional(),
});

const sendNewsletterSchema = z.object({
  subject: z.string().min(1, "عنوان الزامی است."),
  htmlContent: z.string().min(1, "محتوای HTML الزامی است."),
  textContent: z.string().optional(),
  testEmail: z.string().email().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const newsletterController = {
  /**
   * POST /api/newsletter/subscribe
   */
  subscribe: (async (req, res, next) => {
    try {
      const parsed = subscribeSchema.parse(req.body);
      const ipAddress = (req.ip || req.headers["x-forwarded-for"] || "unknown") as string;

      const result = await newsletterService.subscribe(
        parsed.email,
        parsed.source || "website",
        ipAddress
      );

      res.json({
        success: true,
        message: result.isNew
          ? "با موفقیت در خبرنامه عضو شدید! ایمیل خوش‌آمدگویی برای شما ارسال شد."
          : result.reactivated
          ? "عضویت شما مجدداً فعال شد! 🎉"
          : "شما قبلاً در خبرنامه عضو هستید.",
        data: {
          email: result.subscription.email,
          isNew: result.isNew,
          reactivated: result.reactivated,
        },
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return next(AppError.badRequest(e.errors[0]?.message || 'خطای اعتبارسنجی'));
      }
      next(e);
    }
  }) as RequestHandler,

  /**
   * POST /api/newsletter/unsubscribe
   * GET /api/newsletter/unsubscribe (for one-click unsubscribe)
   */
  unsubscribe: (async (req, res, next) => {
    try {
      const data = req.method === "GET" ? req.query : req.body;
      const parsed = unsubscribeSchema.parse(data);

      const result = await newsletterService.unsubscribe(
        parsed.email,
        parsed.token
      );

      // If GET request (one-click), redirect to confirmation page
      if (req.method === "GET") {
        return res.redirect(
          `${process.env.FRONTEND_URL || ""}/newsletter/unsubscribed?email=${encodeURIComponent(parsed.email)}`
        );
      }

      res.json({
        success: true,
        message: result.alreadyUnsubscribed
          ? "شما قبلاً از خبرنامه لغو اشتراک کرده‌اید."
          : "با موفقیت از خبرنامه لغو اشتراک شدید.",
        data: {
          email: result.subscription.email,
        },
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return next(AppError.badRequest(e.errors[0]?.message || 'خطای اعتبارسنجی'));
      }
      next(e);
    }
  }) as RequestHandler,

  /**
   * GET /api/newsletter/subscriptions (admin only)
   */
  getSubscriptions: (async (req, res, next) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const perPage = req.query.perPage ? Number(req.query.perPage) : 50;

      const result = await newsletterService.getActiveSubscriptions(
        page,
        perPage
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (e) {
      next(e);
    }
  }) as RequestHandler,

  /**
   * GET /api/newsletter/statistics (admin only)
   */
  getStatistics: (async (req, res, next) => {
    try {
      const stats = await newsletterService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (e) {
      next(e);
    }
  }) as RequestHandler,

  /**
   * POST /api/newsletter/send (admin only)
   */
  sendNewsletter: (async (req, res, next) => {
    try {
      const parsed = sendNewsletterSchema.parse(req.body);

      const result = await newsletterService.sendNewsletter({
        subject: parsed.subject,
        htmlContent: parsed.htmlContent,
        textContent: parsed.textContent,
        testEmail: parsed.testEmail,
        scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : undefined,
      });

      res.json({
        success: true,
        message: parsed.testEmail
          ? "ایمیل تستی ارسال شد."
          : result.queued
          ? `خبرنامه برای ${result.sent} مشترک در صف قرار گرفت.`
          : `خبرنامه برای ${result.sent} مشترک ارسال شد.`,
        data: result,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return next(AppError.badRequest(e.errors[0]?.message || 'خطای اعتبارسنجی'));
      }
      next(e);
    }
  }) as RequestHandler,

  /**
   * GET /api/newsletter/export (admin only)
   */
  exportSubscribers: (async (req, res, next) => {
    try {
      const csv = await newsletterService.exportSubscribers();

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="subscribers-${new Date().toISOString().split("T")[0]}.csv"`
      );
      res.send("\ufeff" + csv); // BOM for Excel UTF-8 support

    } catch (e) {
      next(e);
    }
  }) as RequestHandler,
};

export default newsletterController;