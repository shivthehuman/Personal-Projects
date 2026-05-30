import { Router } from "express";
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "@b2b/shared";

import type { AppEnv } from "../config/env.js";
import { validateBody } from "../middleware/validate-body.js";
import { makeAuthController } from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rate-limit.js";

export function createAuthRouter(env: AppEnv): Router {
  const router = Router();
  const ctl = makeAuthController(env);

  // Apply auth limiter to authentication endpoints
  router.post("/register", authLimiter, validateBody(registerSchema), ctl.register);
  router.post("/login", authLimiter, validateBody(loginSchema), ctl.login);
  router.post("/refresh", validateBody(refreshSchema), ctl.refresh);
  router.post("/logout", validateBody(logoutSchema), ctl.logout);

  return router;
}
