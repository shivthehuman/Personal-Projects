import { useSyncExternalStore } from "react";

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getServerSnapshot(): string | null {
  return null;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener());
}

export function useAccessToken(): string | null {
  return useSyncExternalStore(subscribe, getAccessToken, getServerSnapshot);
}
