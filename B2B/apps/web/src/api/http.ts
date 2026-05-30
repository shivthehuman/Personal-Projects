import axios, { type InternalAxiosRequestConfig } from "axios";

import { attemptRefresh } from "./session";
import { getApiOrigin } from "../lib/env";
import { getAccessToken, setAccessToken } from "../lib/token-store";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { __retry?: boolean };

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (!token) return config;

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, async (rawError: unknown) => {
  if (!axios.isAxiosError(rawError)) {
    return Promise.reject(rawError);
  }

  const error = rawError;
  const cfg = error.config as RetryConfig | undefined;
  if (!cfg) {
    return Promise.reject(error);
  }

  if (cfg.__retry) {
    return Promise.reject(error);
  }

  if (error.response?.status !== 401) {
    return Promise.reject(error);
  }

  const path = `${cfg.url ?? ""}`;
  const authPathFragments = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
  if (authPathFragments.some((frag) => path.includes(frag))) {
    return Promise.reject(error);
  }

  cfg.__retry = true;

  const refreshed = await attemptRefresh();
  if (!refreshed) {
    setAccessToken(null);
    return Promise.reject(error);
  }

  cfg.headers = cfg.headers ?? {};
  cfg.headers.Authorization = `Bearer ${refreshed}`;

  return api.request(cfg);
});
