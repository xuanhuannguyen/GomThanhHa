import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  ADMIN_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);

const defaultAllowedOrigins = [
  "https://binh-gom-thanh-ha-web.vercel.app",
  "https://gomthanhha.click",
  "https://www.gomthanhha.click"
];

export const allowedOrigins = Array.from(new Set([
  ...defaultAllowedOrigins,
  ...env.CORS_ORIGIN.split(",")
]))
  .map((origin) => origin.trim())
  .filter(Boolean);
