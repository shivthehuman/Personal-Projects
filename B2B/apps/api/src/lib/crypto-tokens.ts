import crypto from "node:crypto";

export function generateRefreshOpaqueToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(pepper: string, refreshTokenPlaintext: string): string {
  return crypto.createHmac("sha256", pepper).update(refreshTokenPlaintext, "utf8").digest("hex");
}

