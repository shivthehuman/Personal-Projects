import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { ValidationError } from "../lib/errors.js";

export function validateBody<Schema extends z.ZodTypeAny>(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(new ValidationError(parsed.error.flatten()));
      return;
    }

    req.body = parsed.data as z.output<Schema>;
    next();
  };
}
