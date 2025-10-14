import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("⚠️  RESEND_API_KEY environment variable is not set. Email verification will not work.");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "");
