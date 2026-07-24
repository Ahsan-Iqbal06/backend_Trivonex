import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // CORS — comma-separated list of allowed frontend origins
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Easypaisa
  EASYPAISA_USERNAME: z.string().min(1, "EASYPAISA_USERNAME is required"),
  EASYPAISA_PASSWORD: z.string().min(1, "EASYPAISA_PASSWORD is required"),
  // Coerced to a real number (not a string) — Easypaisa's docs type this field as Long.
  EASYPAISA_STORE_ID: z.coerce
    .number({ invalid_type_error: "EASYPAISA_STORE_ID must be numeric" })
    .int("EASYPAISA_STORE_ID must be a whole number")
    .positive("EASYPAISA_STORE_ID must be a positive number"),
  EASYPAISA_BASE_URL: z.string().url(),
  EASYPAISA_MERCHANT_EWP_ACCOUNT: z.string().min(1, "EASYPAISA_MERCHANT_EWP_ACCOUNT is required"),
  EASYPAISA_MOCK_MODE: z
    .preprocess((val) => val === "true" || val === true || val === "1", z.boolean())
    .default(false),

  // SMTP (contact form)
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  CONTACT_FORM_RECEIVER: z.string().email(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
