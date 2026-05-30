import type { Response } from "express";
import type { AppEnv } from "../config/env.js";

export function setRefreshCookie(
  env: AppEnv,
  res: Response,
  refreshTokenPlaintext: string,
  expiresAt: Date,
  cookieName?: string
): void {
  const maxAgeMs = expiresAt.getTime() - Date.now();
  const name = cookieName ?? env.COOKIE_REFRESH_NAME;

  res.cookie(name, refreshTokenPlaintext, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
    maxAge: Number.isFinite(maxAgeMs) && maxAgeMs > 0 ? maxAgeMs : 0,
  });
}

export function clearRefreshCookie(env: AppEnv, res: Response, cookieName?: string): void {
  const name = cookieName ?? env.COOKIE_REFRESH_NAME;
  res.clearCookie(name, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/auth",
  });
}
