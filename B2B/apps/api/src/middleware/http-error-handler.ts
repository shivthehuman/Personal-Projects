import type { ErrorRequestHandler } from "express";

import { ApiError, ValidationError } from "../lib/errors.js";

export const httpErrorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ValidationError) {
    res.status(error.status).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('API Error:', error instanceof Error ? error.message : String(error));

  res.status(500).json({ error: "Internal Server Error" });
};
