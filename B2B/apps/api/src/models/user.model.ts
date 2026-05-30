import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";
import type { UserRole } from "@b2b/shared";

const userRoleValues = ["buyer", "seller", "transporter", "admin"] satisfies readonly UserRole[];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: userRoleValues,
      index: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    onboardingStep: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export type UserModel = Model<InferSchemaType<typeof userSchema>>;
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
