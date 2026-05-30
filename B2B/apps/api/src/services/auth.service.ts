import mongoose from "mongoose";
import type { Response } from "express";
import type { LoginInput, RegisterInput } from "@b2b/shared";

import type { AppEnv } from "../config/env.js";
import { Organization } from "../models/organization.model.js";
import { User } from "../models/user.model.js";
import { RefreshToken } from "../models/refresh-token.model.js";
import { clearRefreshCookie, setRefreshCookie } from "../lib/cookies.js";
import { generateRefreshOpaqueToken, hashRefreshToken } from "../lib/crypto-tokens.js";
import { verifyPassword, hashPassword } from "../lib/password.js";
import { signAccessToken, type AccessTokenClaims } from "../lib/jwt-access.js";
import { ConflictError, UnauthorizedError } from "../lib/errors.js";

// Simple in-memory OTP store for demo purposes
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function requestOtp(phone: string): Promise<void> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(phone, { code, expiresAt });
  // In production: send SMS via provider. Here we log a masked message.
  console.log(`OTP for ${phone}: ${code} (expires in 5m)`);
}

export async function verifyOtp(env: AppEnv, res: Response, phone: string, code: string) {
  const record = otpStore.get(phone);
  if (!record || record.expiresAt < Date.now() || record.code !== code) {
    throw new UnauthorizedError("Invalid or expired OTP.");
  }

  // consume
  otpStore.delete(phone);

  // Attempt to find organization by phone
  let org = await Organization.findOne({ phone }).exec();
  let user = null;

  if (org) {
    user = await User.findOne({ organizationId: org._id }).exec();
  }

  if (!org) {
    // create placeholder org and user (onboarding continues later)
    org = new Organization({ legalName: phone, orgType: "other", location: { type: "Point", coordinates: [0, 0] }, phone });
    await org.save();

    const passwordHash = await hashPassword(Math.random().toString(36));
    user = new User({ email: `${phone}@otp.local`, passwordHash, role: "buyer", organizationId: org._id, onboardingStep: 1, isProfileComplete: false });
    await user.save();
  }

  // issue session
  const tokens = await issueSession(env, res, user.id, {
    sub: user.id,
    email: user.email,
    role: user.role as AccessTokenClaims["role"],
    organizationId: org._id.toString(),
  });

  return { ...tokens, user: { id: user.id, email: user.email, role: user.role, organizationId: org._id.toString() } };
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

async function issueSession(
  env: AppEnv,
  res: Response,
  userId: string,
  claims: AccessTokenClaims
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  const accessToken = signAccessToken(env.JWT_ACCESS_SECRET, claims, env.ACCESS_TOKEN_TTL_SECONDS);
  const refreshPlaintext = generateRefreshOpaqueToken();
  const hashed = hashRefreshToken(env.JWT_REFRESH_PEPPER, refreshPlaintext);

  const expiresAt = addDays(new Date(), env.REFRESH_TOKEN_TTL_DAYS);
  await RefreshToken.create({
    userId: new mongoose.Types.ObjectId(userId),
    hashedToken: hashed,
    expiresAt,
  });

  setRefreshCookie(env, res, refreshPlaintext, expiresAt);

  return { accessToken, expiresInSeconds: env.ACCESS_TOKEN_TTL_SECONDS };
}

export async function register(
  env: AppEnv,
  res: Response,
  input: RegisterInput
): Promise<{
  accessToken: string;
  expiresInSeconds: number;
  user: { id: string; email: string; role: AccessTokenClaims["role"]; organizationId: string };
  organization: {
    id: string;
    legalName: string;
    organizationType: string;
    location: { type: "Point"; coordinates: [number, number] };
  };
}> {
  console.log("[REGISTER SERVICE] Starting registration for email:", input.email);
  console.log("[REGISTER SERVICE] JWT_ACCESS_SECRET is set:", !!env.JWT_ACCESS_SECRET);
  console.log("[REGISTER SERVICE] JWT_REFRESH_PEPPER is set:", !!env.JWT_REFRESH_PEPPER);
  const session = await mongoose.startSession();

  try {
    const persisted = await session.withTransaction(async () => {
      const passwordHash = await hashPassword(input.password);

      const organization = new Organization({
        legalName: input.organization.legalName,
        orgType: input.organization.type,
        location: input.organization.location,
        addressLine1: input.organization.addressLine1,
        addressLine2: input.organization.addressLine2,
        city: input.organization.city,
        state: input.organization.state,
        postalCode: input.organization.postalCode,
        countryCode: input.organization.countryCode,
        phone: input.organization.phone,
        email: input.organization.email,
      });
      await organization.save({ session });

      const user = new User({
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        organizationId: organization._id,
      });
      await user.save({ session });

      return {
        userId: user._id as mongoose.Types.ObjectId,
        orgId: organization._id as mongoose.Types.ObjectId,
        organization: {
          legalName: organization.legalName,
          organizationType: organization.orgType,
          location: {
            type: "Point" as const,
            coordinates: organization.location.coordinates as [number, number],
          },
        },
      };
    });

    const { userId, orgId, organization: orgSnap } = persisted;

    if (!userId || !orgId || !orgSnap) {
      throw new Error("Registration transaction did not persist user/organization correctly");
    }

    const tokens = await issueSession(env, res, userId.toString(), {
      sub: userId.toString(),
      email: input.email.toLowerCase(),
      role: input.role,
      organizationId: orgId.toString(),
    });

    return {
      ...tokens,
      user: {
        id: userId.toString(),
        email: input.email.toLowerCase(),
        role: input.role,
        organizationId: orgId.toString(),
      },
      organization: {
        id: orgId.toString(),
        legalName: orgSnap.legalName,
        organizationType: orgSnap.organizationType,
        location: orgSnap.location,
      },
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      console.error("[REGISTER SERVICE] Duplicate key error:", error);
      throw new ConflictError("An account already exists with that email address.");
    }
    console.error("[REGISTER SERVICE] Registration failed:", error instanceof Error ? error.message : String(error), error);
    throw error;
  } finally {
    await session.endSession();
  }
}

export async function login(
  env: AppEnv,
  res: Response,
  input: LoginInput
): Promise<{
  accessToken: string;
  expiresInSeconds: number;
  user: { id: string; email: string; role: AccessTokenClaims["role"]; organizationId: string };
}> {
  const email = input.email.toLowerCase();
  const user = await User.findOne({ email }).exec();

  if (!user) throw new UnauthorizedError("Invalid credentials.");
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid credentials.");

  const orgId = user.organizationId.toString();

  const tokens = await issueSession(env, res, user.id, {
    sub: user.id,
    email: user.email,
    role: user.role as AccessTokenClaims["role"],
    organizationId: orgId.toString(),
  });

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as AccessTokenClaims["role"],
      organizationId: orgId.toString(),
    },
  };
}

export async function refreshSession(
  env: AppEnv,
  res: Response,
  refreshTokenPlaintext: string | undefined
): Promise<{ accessToken: string; expiresInSeconds: number }> {
  if (!refreshTokenPlaintext) throw new UnauthorizedError("Missing refresh session.");

  const hashed = hashRefreshToken(env.JWT_REFRESH_PEPPER, refreshTokenPlaintext);
  const existing = await RefreshToken.findOne({ hashedToken: hashed }).exec();

  if (!existing) throw new UnauthorizedError("Invalid credentials.");
  if (existing.expiresAt.getTime() <= Date.now()) {
    await RefreshToken.deleteMany({ hashedToken: hashed });
    clearRefreshCookie(env, res);
    throw new UnauthorizedError("Session expired.");
  }

  const user = await User.findById(existing.userId).exec();
  if (!user) {
    await RefreshToken.deleteMany({ _id: existing._id });
    clearRefreshCookie(env, res);
    throw new UnauthorizedError("Invalid credentials.");
  }

  const orgId = user.organizationId.toString();

  await RefreshToken.deleteMany({ hashedToken: hashed });
  clearRefreshCookie(env, res);

  return issueSession(env, res, user.id, {
    sub: user.id,
    email: user.email,
    role: user.role as AccessTokenClaims["role"],
    organizationId: orgId,
  });
}

export async function logout(env: AppEnv, res: Response, refreshTokenPlaintext: string | undefined): Promise<void> {
  clearRefreshCookie(env, res);

  if (!refreshTokenPlaintext) return;

  const hashed = hashRefreshToken(env.JWT_REFRESH_PEPPER, refreshTokenPlaintext);
  await RefreshToken.deleteMany({ hashedToken: hashed });
}
