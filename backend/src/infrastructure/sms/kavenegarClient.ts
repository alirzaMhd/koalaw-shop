// src/infrastructure/sms/kavenegarClient.ts
// Kavenegar SMS client wrapper (promise-based) with VerifyLookup + Send fallback

import { env } from "../../config/env";
import { logger } from "../../config/logger";

// Lazy require to avoid type issues and optional dependency in some environments
let Kavenegar: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Kavenegar = require("kavenegar");
} catch {
  // optional; will throw at runtime if actually used
}

let api: any = null;

function getApi() {
  if (!Kavenegar) {
    throw new Error("kavenegar package not installed. Run `npm i kavenegar`.");
  }
  if (!api) {
    const apiKey =
      (env as any).KAVENEGAR_API_KEY ||
      process.env.KAVENEGAR_API_KEY ||
      "";
    if (!apiKey) {
      throw new Error("KAVENEGAR_API_KEY is not set in environment.");
    }
    api = Kavenegar.KavenegarApi({ apikey: apiKey });
  }
  return api;
}

type SendArgs = { receptor: string; message: string; sender?: string };
function kvSend(args: SendArgs): Promise<any> {
    const client = getApi();
    return new Promise((resolve, reject) => {
      client.Send(args, (response: any, status: number) => {
          const ok = status === 200;
      if (ok) resolve(response);
      else
        reject(
          new Error(
            `Kavenegar Send failed (${status}/${response?.return?.status}): ${
              response?.return?.message || "Unknown"
            }`
          )
        );
    });
  });
}

type LookupArgs = {
  receptor: string;
  token: string;
  template: string;
  token2?: string;
  token3?: string;
  type?: string;
};
function kvVerifyLookup(args: LookupArgs): Promise<any> {
  const client = getApi();
  return new Promise((resolve, reject) => {
    client.VerifyLookup(args, (response: any, status: number) => {
      const ok = status === 200 && response?.return?.status === 200;
      if (ok) resolve(response);
      else
        reject(
          new Error(
            `Kavenegar VerifyLookup failed (${status}/${response?.return?.status}): ${
              response?.return?.message || "Unknown"
            }`
          )
        );
    });
  });
}

export async function sendOtpViaKavenegar(opts: {
  receptor: string; // 09xxxxxxxxx
  code: string; // OTP code
  template?: string; // optional template name
  sender?: string; // optional sender line (for Send fallback)
  ttlSec?: number; // optional TTL to pass as token2
  appName?: string; // optional app name to pass as token3
}) {
  const { receptor, code, template, sender, ttlSec, appName } = opts;

  // Prefer env template, then payload template
  const envTemplate =
    (env as any).KAVENEGAR_VERIFY_TEMPLATE || process.env.KAVENEGAR_VERIFY_TEMPLATE;
    const senderLine =
    (env as any).KAVENEGAR_SENDER || process.env.KAVENEGAR_SENDER || sender;
  const message = `کد تایید شما: ${code}
${appName ? appName + "\n" : ""}${ttlSec ? "اعتبار: " + ttlSec + " ثانیه" : ""}`.trim();

  return kvSend({ receptor, message, sender: senderLine });
}

export const kavenegarSms = { sendOtpViaKavenegar };