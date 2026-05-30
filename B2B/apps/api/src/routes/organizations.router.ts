import { Router } from "express";
import { Organization } from "../models/organization.model.js";
import { requireAccessToken } from "../middleware/require-access-token.js";
import { asyncHandler } from "../lib/async-handler.js";
import multer from "multer";
import path from "path";
import fs from "fs";

import type { AppEnv } from "../config/env.js";

export function createOrganizationsRouter(env: AppEnv) {
    const router = Router();

    // Simple GST validation (regex) and mock verification response
    router.post(
        "/verify-gst",
        asyncHandler(async (req, res) => {
            const { orgId, gstin } = req.body as { orgId?: string; gstin?: string };

            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
            const isValid = typeof gstin === "string" && gstRegex.test(gstin);

            if (!orgId) {
                res.status(400).json({ error: "orgId required" });
                return;
            }

            const org = await Organization.findById(orgId);
            if (!org) {
                res.status(404).json({ error: "Organization not found" });
                return;
            }

            org.gstin = gstin;
            org.verificationStatus = isValid ? "Verified" : "Rejected";
            await org.save();

            res.json({ ok: true, verified: isValid });
            return;
        })
    );

    // KYC upload (accepts JSON with docs). Redact idNumbers in logs.
    // Multipart file upload (single file field `document`)
    const uploadsDir = path.join(process.cwd(), "apps", "api", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req: any, _file: any, cb: any) => cb(null, uploadsDir),
        filename: (_req: any, file: any, cb: any) => {
            const ts = Date.now();
            const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
            cb(null, `${ts}-${safe}`);
        },
    });

    function fileFilter(_req: any, file: any, cb: any) {
        const allowed = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Invalid file type"));
        }
        cb(null, true);
    }

    const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

    router.post(
        "/kyc-upload",
        requireAccessToken(env),
        upload.single("document"),
        asyncHandler(async (req, res) => {
            // req.file is present with multer
            if (!req.authUser) {
                res.status(401).json({ error: "Missing access token." });
                return;
            }

            const org = await Organization.findById(req.authUser.organizationId);
            if (!org) {
                res.status(404).json({ error: "Organization not found" });
                return;
            }

            const file = (req as any).file as any | undefined;
            if (!file) {
                res.status(400).json({ error: "No file uploaded or invalid file type." });
                return;
            }

            const relPath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");

            org.verificationDocuments = org.verificationDocuments || [];
            org.verificationDocuments.push({ docType: "business_license", url: `/${relPath}`, status: "Pending" } as any);
            org.verificationStatus = "Pending";
            await org.save();

            console.log("KYC file uploaded for org", org.id, "->", file.filename);

            res.json({ ok: true, path: `/${relPath}` });
            return;
        })
    );

    // PATCH /organizations/location - save coordinates for the authenticated user's org
    router.patch(
        "/location",
        requireAccessToken(env),
        asyncHandler(async (req, res) => {
            const { coordinates } = req.body as { coordinates?: [number, number] };

            if (!req.authUser) {
                res.status(401).json({ error: "Missing access token." });
                return;
            }

            if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
                res.status(400).json({ error: "coordinates must be [lng, lat]" });
                return;
            }

            const org = await Organization.findById(req.authUser.organizationId);
            if (!org) {
                res.status(404).json({ error: "Organization not found" });
                return;
            }

            org.location = { type: "Point", coordinates } as any;
            await org.save();

            res.json({ ok: true, location: org.location });
            return;
        })
    );

    return router;
}
