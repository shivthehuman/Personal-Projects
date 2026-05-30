import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";
import type { OrgType } from "@b2b/shared";

const orgTypeValues = ["buyer", "seller", "transporter", "other"] satisfies readonly OrgType[];

const organizationSchema = new Schema(
  {
    legalName: { type: String, required: true, trim: true, maxlength: 200 },
    orgType: { type: String, required: true, enum: orgTypeValues },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords: unknown) => Array.isArray(coords) && coords.length === 2,
          message: "Coordinates must be [lng, lat]",
        },
      },
      _id: false,
    },
    addressLine1: { type: String, trim: true, maxlength: 300 },
    addressLine2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 120 },
    postalCode: { type: String, trim: true, maxlength: 24 },
    countryCode: { type: String, trim: true, uppercase: true, maxlength: 2 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 15 },
    businessType: { type: String, trim: true, maxlength: 60 },
    verificationStatus: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
    verificationDocuments: [
      {
        type: {
          docType: { type: String, required: true },
          url: { type: String, required: true },
          status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
        },
        _id: false,
      },
    ],
    trustScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

organizationSchema.index({ legalName: 1 });
organizationSchema.index({ location: "2dsphere" });

export type OrganizationDoc = HydratedDocument<InferSchemaType<typeof organizationSchema>>;
export type OrganizationModel = Model<InferSchemaType<typeof organizationSchema>>;
export const Organization = mongoose.models.Organization ?? mongoose.model("Organization", organizationSchema);
