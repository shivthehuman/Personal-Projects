import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { UnauthorizedError } from "../lib/errors.js";
import type { AppEnv } from "../config/env.js";
import { verifyAccessToken } from "../lib/jwt-access.js";

export function requireAccessToken(env: AppEnv): RequestHandler {
  return asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization;
    const prefix = "bearer ";

    if (!header || !header.toLowerCase().startsWith(prefix)) {
      next(new UnauthorizedError("Missing access token."));
      return;
    }

    const token = header.slice(prefix.length).trim();
    if (!token) {
      next(new UnauthorizedError("Missing access token."));
      return;
    }

    try {
      const claims = verifyAccessToken(env.JWT_ACCESS_SECRET, token);

      req.authUser = {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
        organizationId: claims.organizationId,
      };

      next();
    } catch {
      next(new UnauthorizedError("Invalid access token."));
    }
  });
}
