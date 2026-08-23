import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16).default("dev-only-insecure-secret-change-me"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_AUTH_MODE: z.enum(["strict", "dev"]).default("dev"),
  ADMIN_DEFAULT_USERNAME: z.string().default("admin"),
  ADMIN_DEFAULT_PASSWORD: z.string().default("admin123"),
  HARDWARE_VERIFICATION_MODE: z.enum(["mock", "real"]).default("mock"),
  BLOCKCHAIN_MODE: z.enum(["mock", "real"]).default("mock"),
  PAYMENT_MODE: z.enum(["mock", "real"]).default("mock"),
  VAULT_MODE: z.enum(["mock", "real"]).default("mock"),
  STORAGE_MODE: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./uploads"),
  CORS_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
