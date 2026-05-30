import type { RequestHandler } from "express";

import { UnauthorizedError } from "../lib/errors.js";
import { Organization } from "../models/organization.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../lib/async-handler.js";

export function getMeHandler(): RequestHandler {
  return asyncHandler(async (req, res) => {
    if (!req.authUser) throw new UnauthorizedError("Missing access token.");

    const user = await User.findById(req.authUser.id).exec();
    if (!user) throw new UnauthorizedError("Invalid access token.");

    const organization = await Organization.findById(user.organizationId).exec();
    if (!organization) {
      res.status(500).json({ error: "User organization missing" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString(),
        isProfileComplete: user.isProfileComplete,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      },
      organization: {
        id: organization.id,
        legalName: organization.legalName,
        organizationType: organization.orgType,
        phone: organization.phone,
        businessType: organization.businessType,
        verificationStatus: organization.verificationStatus,
        location: {
          type: "Point",
          coordinates: organization.location.coordinates as [number, number],
        },
        addressLine1: organization.addressLine1,
        addressLine2: organization.addressLine2,
        city: organization.city,
        state: organization.state,
        postalCode: organization.postalCode,
        countryCode: organization.countryCode,
        createdAt: organization.createdAt?.toISOString(),
        updatedAt: organization.updatedAt?.toISOString(),
      },
    });
  });
}

export function updateMeHandler(): RequestHandler {
  return asyncHandler(async (req, res) => {
    if (!req.authUser) throw new UnauthorizedError("Missing access token.");

    const user = await User.findById(req.authUser.id).exec();
    if (!user) throw new UnauthorizedError("Invalid access token.");

    const { onboardingStep, isProfileComplete, organization: orgPatch, role } = req.body as {
      onboardingStep?: string | number;
      isProfileComplete?: boolean;
      organization?: {
        legalName?: string;
        phone?: string;
        businessType?: string;
      };
      role?: string;
    };

    if (typeof isProfileComplete === "boolean") user.isProfileComplete = isProfileComplete;
    if (typeof role === "string" && role.length > 0) user.role = role as any;
    if (onboardingStep !== undefined) user.onboardingStep = typeof onboardingStep === "number" ? onboardingStep : user.onboardingStep;

    await user.save();

    if (orgPatch && typeof orgPatch === "object") {
      const organization = await Organization.findById(user.organizationId).exec();
      if (organization) {
        if (typeof orgPatch.legalName === "string") organization.legalName = orgPatch.legalName.trim();
        if (typeof orgPatch.phone === "string") organization.phone = orgPatch.phone.trim();
        if (typeof orgPatch.businessType === "string") organization.businessType = orgPatch.businessType.trim();
        await organization.save();
      }
    }

    res.json({ ok: true, user: { id: user.id, onboardingStep: user.onboardingStep, isProfileComplete: user.isProfileComplete } });
    return;
  });
}
