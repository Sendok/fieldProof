import nodemailer from "nodemailer";

import { getRuntimeEnv } from "@/server/env";

export async function sendEmail(input: { to: string; subject: string; text: string }): Promise<void> {
  const env = getRuntimeEnv();
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  await transport.sendMail({ from: env.EMAIL_FROM, ...input });
}
