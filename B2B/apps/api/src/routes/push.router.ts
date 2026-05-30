import { Router } from "express";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "@b2b/shared";

import type { AppEnv } from "../config/env.js";
import { validateBody } from "../middleware/validate-body.js";
import { requireAccessToken } from "../middleware/require-access-token.js";
import { makePushController } from "../controllers/push.controller.js";

export function createPushRouter(env: AppEnv): Router {
  const router = Router();
  const ctl = makePushController();

  router.post("/subscribe", requireAccessToken(env), validateBody(pushSubscribeSchema), ctl.subscribe);
  router.delete("/unsubscribe", requireAccessToken(env), validateBody(pushUnsubscribeSchema), ctl.unsubscribe);

  return router;
}
