import mongoose from "mongoose";
import type { RequestHandler } from "express";

import { asyncHandler } from "../lib/async-handler.js";
import { UnauthorizedError } from "../lib/errors.js";
import { PushSubscription } from "../models/push-subscription.model.js";

export function makePushController(): { subscribe: RequestHandler; unsubscribe: RequestHandler } {
  return {
    subscribe: asyncHandler(async (req, res) => {
      if (!req.authUser) throw new UnauthorizedError("Missing access token.");

      const userId = req.authUser.id;
      const { endpoint, keys } = req.body;
      const userAgentRaw = req.headers["user-agent"];
      const userAgent = typeof userAgentRaw === "string" ? userAgentRaw : undefined;

      await PushSubscription.updateOne(
        {
          userId: new mongoose.Types.ObjectId(userId),
          endpoint,
        },
        { $set: { keys, userAgent } },
        { upsert: true }
      );

      res.status(204).send();
    }),
    unsubscribe: asyncHandler(async (req, res) => {
      if (!req.authUser) throw new UnauthorizedError("Missing access token.");

      const userId = req.authUser.id;
      const { endpoint } = req.body;

      await PushSubscription.deleteOne({
        userId: new mongoose.Types.ObjectId(userId),
        endpoint,
      });

      res.status(204).send();
    }),
  };
}
