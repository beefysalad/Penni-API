import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  APP_NAME: z.string().default("Penni API"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_JWT_KEY: z.string().optional(),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsedEnv.NODE_ENV,
  appName: parsedEnv.APP_NAME,
  host: parsedEnv.HOST,
  port: parsedEnv.PORT,
  rateLimitMax: parsedEnv.RATE_LIMIT_MAX,
  rateLimitWindowMs: parsedEnv.RATE_LIMIT_WINDOW_MS,
  corsOrigin: parsedEnv.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  databaseUrl: parsedEnv.DATABASE_URL,
  clerkSecretKey: parsedEnv.CLERK_SECRET_KEY,
  clerkJwtKey: parsedEnv.CLERK_JWT_KEY,
} as const;
