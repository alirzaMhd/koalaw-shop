// src/infrastructure/mail/mailer.ts
// Nodemailer transporter factory. Falls back to JSON/logging transport if SMTP not configured.
import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
function buildTransport() {
  const host = env.SMTP_HOST;
  const port = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const secure = String(env.SMTP_SECURE || "false") === "true";
  if (host && port) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
    transporter.verify().then(
      () => logger.info("SMTP transporter verified."),
      (e) =>
        logger.warn(
          { err: e?.message },
          "SMTP verify failed (will still try to send)."
        )
    );
    return transporter;
  }
  logger.warn("SMTP not configured; using JSON transport (logging only).");
  return nodemailer.createTransport({ jsonTransport: true });
}
export const transporter = buildTransport();
export const mailer = {
  async sendMail(opts) {
    const info = await transporter.sendMail(opts);
    if (transporter.options?.jsonTransport) {
      logger.info({ payload: info.message }, "Email JSON transport payload");
    } else {
      logger.info({ messageId: info.messageId }, "Email sent");
    }
    return info;
  },
};
export default mailer;
//# sourceMappingURL=mailer.js.map
