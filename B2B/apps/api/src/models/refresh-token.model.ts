import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hashedToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = HydratedDocument<InferSchemaType<typeof refreshTokenSchema>>;
export type RefreshTokenModel = Model<InferSchemaType<typeof refreshTokenSchema>>;
export const RefreshToken =
  mongoose.models.RefreshToken ?? mongoose.model("RefreshToken", refreshTokenSchema);
