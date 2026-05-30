import jwt from "jsonwebtoken";
import type { UserRole } from "@b2b/shared";

export type AccessTokenClaims = {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string;
};

export function signAccessToken(secret: string, claims: AccessTokenClaims, ttlSeconds: number): string {
  return jwt.sign(
    {
      sub: claims.sub,
      email: claims.email,
      role: claims.role,
      organizationId: claims.organizationId,
    },
    secret,
    { algorithm: "HS256", expiresIn: ttlSeconds }
  );
}

export function verifyAccessToken(secret: string, token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, secret) as jwt.JwtPayload & Partial<AccessTokenClaims>;
  const sub = typeof decoded.sub === "string" ? decoded.sub : "";
  const email = typeof decoded.email === "string" ? decoded.email : "";
  const role = decoded.role as UserRole | undefined;
  const organizationId = typeof decoded.organizationId === "string" ? decoded.organizationId : "";

  if (!sub || !email || !role || !organizationId) {
    throw new jwt.JsonWebTokenError("Malformed access token");
  }

  return { sub, email, role, organizationId };
}
