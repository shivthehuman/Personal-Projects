import "dotenv/config";
import { z } from "@b2b/shared";

const mongoUriSchema = z.custom<string>((val) => typeof val === "string" && /^mongodb(\+srv)?:\/\//i.test(val.trim()), {
  message: "MONGO_URI must be a mongodb:// or mongodb+srv:// connection string",
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional().default("development"),
  PORT: z.coerce.number().positive().optional().default(3001),
  MONGO_URI: mongoUriSchema,
  WEB_ORIGIN: z.string().trim().url().optional().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_PEPPER: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().optional().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().optional().default(14),
  COOKIE_REFRESH_NAME: z.string().trim().min(1).optional().default("refresh_token"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

function trimmed(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v && v.length > 0 ? v : undefined;
}

export function getEnv(): AppEnv {
  cached ??= envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGO_URI: trimmed(process.env.MONGO_URI) ?? "mongodb://localhost:27017/b2b",
    WEB_ORIGIN: trimmed(process.env.WEB_ORIGIN),
    JWT_ACCESS_SECRET: trimmed(process.env.JWT_ACCESS_SECRET),
    JWT_REFRESH_PEPPER: trimmed(process.env.JWT_REFRESH_PEPPER),
    ACCESS_TOKEN_TTL_SECONDS: trimmed(process.env.ACCESS_TOKEN_TTL_SECONDS),
    REFRESH_TOKEN_TTL_DAYS: trimmed(process.env.REFRESH_TOKEN_TTL_DAYS),
    COOKIE_REFRESH_NAME: trimmed(process.env.COOKIE_REFRESH_NAME),
  });
  return cached;
}
