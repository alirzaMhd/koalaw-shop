// src/events/handlers/auth.otp.handler.ts
// Listens to "auth.otp.sent" and sends the OTP via Kavenegar

import { eventBus } from "../eventBus";
import { logger } from "../../config/logger";
import { sendOtpViaKavenegar } from "../../infrastructure/sms/kavenegarClient";
import { env } from "../../config/env";

function maskPhone(p: string) {
  const d = (p || "").replace(/\D/g, "");
  // Use ASCII * to avoid RTL/font issues showing exotic glyphs in logs
  return d.replace(/\d(?=\d{4})/g, "*");
}

export function bindAuthOtpSentHandler() {
  eventBus.on("auth.otp.sent", async (payload: any) => {
    // Expected payload from auth.service:
    // { to: string; template?: string; code: string; app?: string; ttlSec?: number }
    const { to, template, code, app, ttlSec } = payload || {};
    if (!to || !code) {
      logger.warn({ payload }, "auth.otp.sent missing required fields");
      return;
    }

    try {
      const sender =
        (env as any).KAVENEGAR_SENDER || process.env.KAVENEGAR_SENDER;
      const res = await sendOtpViaKavenegar({
        receptor: to,
        code,
        template,
        ttlSec,
        appName: app,
        sender,
      });

      const entry =
        Array.isArray(res?.entries) && res.entries.length
          ? res.entries[0]
          : res?.entries;

      logger.info(
        {
          to: maskPhone(to),
          provider: "kavenegar",
          status: res?.return?.status,
          statusText: res?.return?.message,
          cost: entry?.cost,
          route: entry?.messageid ? "lookup" : "send", // heuristic
        },
        "OTP SMS dispatched via Kavenegar"
      );
    } catch (err: any) {
      logger.error(
        {
          err: { message: err?.message, stack: err?.stack },
          to: maskPhone(to),
        },
        "Failed to send OTP via Kavenegar"
      );
    }
  });
}