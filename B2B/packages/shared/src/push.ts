import { z } from "zod";

export const pushSubscribeSchema = z
  .object({
    endpoint: z.string().trim().url().max(4096),
    keys: z.object({
      p256dh: z.string().min(1).max(512),
      auth: z.string().min(1).max(256),
    }),
  })
  .strict();

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

export const pushUnsubscribeSchema = z
  .object({
    endpoint: z.string().trim().url().max(4096),
  })
  .strict();
