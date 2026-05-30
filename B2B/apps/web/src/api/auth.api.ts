import { api } from "./http";
import { setAccessToken } from "../lib/token-store";

export type LoginResponse = {
  accessToken: string;
  expiresInSeconds: number;
};

export async function loginRequest(payload: { email: string; password: string }): Promise<LoginResponse> {
  const resp = await api.post<LoginResponse>("/auth/login", payload);
  setAccessToken(resp.data.accessToken);
  return resp.data;
}

export type RegisterResponse = LoginResponse & {
  user: { id: string; email: string; role: string; organizationId: string };
  organization: {
    id: string;
    legalName: string;
    organizationType: string;
    location: { type: "Point"; coordinates: [number, number] };
  };
};

export async function registerRequest(payload: unknown): Promise<RegisterResponse> {
  const resp = await api.post<RegisterResponse>("/auth/register", payload);
  setAccessToken(resp.data.accessToken);
  return resp.data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post("/auth/logout", {});
  } finally {
    setAccessToken(null);
  }
}
