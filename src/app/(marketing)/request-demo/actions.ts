"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendEmail } from "@/server/email/client";
import { getRuntimeEnv } from "@/server/env";
import { logger } from "@/server/observability/logger";
import { enforceRateLimit } from "@/server/security/rate-limit";

const requestDemoSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(254),
  company: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  role: z.string().trim().min(2).max(80),
  teamSize: z.enum(["1-5", "6-25", "26-100", "100+"]),
  industry: z.string().trim().min(2).max(80),
  plan: z.string().trim().max(40).optional(),
  message: z.string().trim().max(2_000).optional(),
  consent: z.literal("on"),
  website: z.string().max(0).optional(),
});

export async function requestDemoAction(formData: FormData): Promise<void> {
  const parsed = requestDemoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/request-demo?error=invalid");
  if (parsed.data.website) redirect("/request-demo?sent=1");
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const allowed = await enforceRateLimit(
    "demo:" + ipAddress + ":" + parsed.data.email,
    5,
    60 * 60,
  );
  if (!allowed) redirect("/request-demo?error=rate-limit");
  const env = getRuntimeEnv();
  try {
    await sendEmail({
      to: env.DEMO_REQUEST_TO ?? env.EMAIL_FROM,
      subject: "Permintaan demo FieldProof baru",
      text: [
        "Nama: " + parsed.data.name,
        "Email: " + parsed.data.email,
        "Perusahaan: " + parsed.data.company,
        "Telepon: " + (parsed.data.phone || "-"),
        "Role: " + parsed.data.role,
        "Ukuran tim: " + parsed.data.teamSize,
        "Industri: " + parsed.data.industry,
        "Paket: " + (parsed.data.plan || "-"),
        "",
        "Kebutuhan:",
        parsed.data.message || "-",
      ].join("\n"),
    });
  } catch (error) {
    logger.error("Demo request delivery failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    redirect("/request-demo?error=delivery");
  }
  redirect("/request-demo?sent=1");
}
