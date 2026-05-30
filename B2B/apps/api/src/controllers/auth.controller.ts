import type { RequestHandler } from "express";

import type { AppEnv } from "../config/env.js";
import * as AuthService from "../services/auth.service.js";
import { asyncHandler } from "../lib/async-handler.js";

export function makeAuthController(env: AppEnv): {
  register: RequestHandler;
  login: RequestHandler;
  refresh: RequestHandler;
  logout: RequestHandler;
  otpRequest: RequestHandler;
  otpVerify: RequestHandler;
} {
  return {
    register: asyncHandler(async (req, res) => {
      console.log("🔥 REGISTER ENDPOINT HIT:", req.body);
      const payload = await AuthService.register(env, res, req.body);
      res.status(201).json(payload);
      return;
    }),
    login: asyncHandler(async (req, res) => {
      const payload = await AuthService.login(env, res, req.body);
      res.status(200).json(payload);
      return;
    }),
    refresh: asyncHandler(async (req, res) => {
      const token = req.cookies[env.COOKIE_REFRESH_NAME];
      const payload = await AuthService.refreshSession(env, res, token);
      res.status(200).json(payload);
      return;
    }),
    logout: asyncHandler(async (req, res) => {
      const token = req.cookies[env.COOKIE_REFRESH_NAME];
      await AuthService.logout(env, res, token);
      res.status(204).send();
      return;
    }),
    otpRequest: asyncHandler(async (req, res) => {
      const { phone } = req.body as { phone?: string };
      if (!phone) {
        res.status(400).json({ error: "phone required" });
        return;
      }
      await AuthService.requestOtp(phone);
      res.json({ ok: true });
      return;
    }),
    otpVerify: asyncHandler(async (req, res) => {
      const { phone, code } = req.body as { phone?: string; code?: string };
      if (!phone || !code) {
        res.status(400).json({ error: "phone and code required" });
        return;
      }
      const payload = await AuthService.verifyOtp(env, res, phone, code);
      res.json(payload);
      return;
    }),
  };
}
