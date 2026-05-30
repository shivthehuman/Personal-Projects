import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@b2b/shared";

import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

export function requireRole(...allowed: readonly UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new UnauthorizedError("Missing access token."));
      return;
    }

    if (!allowed.includes(req.authUser.role)) {
      next(new ForbiddenError("Insufficient permissions."));
      return;
    }

    next();
  };
}
