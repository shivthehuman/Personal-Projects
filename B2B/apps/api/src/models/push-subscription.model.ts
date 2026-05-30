import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";

const pushKeysSchema = new Schema(
  {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { _id: false }
);

const pushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, trim: true, maxlength: 4096 },
    keys: { type: pushKeysSchema, required: true },
    userAgent: { type: String, trim: true, maxlength: 512 },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export type PushSubscriptionDoc = HydratedDocument<InferSchemaType<typeof pushSubscriptionSchema>>;
export type PushSubscriptionModel = Model<InferSchemaType<typeof pushSubscriptionSchema>>;
export const PushSubscription =
  mongoose.models.PushSubscription ?? mongoose.model("PushSubscription", pushSubscriptionSchema);
