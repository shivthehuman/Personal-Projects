import { Router } from "express";

import type { AppEnv } from "../config/env.js";
import { requireAccessToken } from "../middleware/require-access-token.js";
import { getMeHandler } from "../controllers/users.controller.js";
import { updateMeHandler } from "../controllers/users.controller.js";

export function createUsersRouter(env: AppEnv): Router {
  const router = Router();

  router.get("/me", requireAccessToken(env), getMeHandler());
  router.patch("/me", requireAccessToken(env), updateMeHandler());

  return router;
}
