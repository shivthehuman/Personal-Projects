import { getApiOrigin } from "../lib/env";
import { setAccessToken } from "../lib/token-store";

let mutex: Promise<string | null> | null = null;

async function refreshInner(): Promise<string | null> {
  try {
    const resp = await fetch(`${getApiOrigin()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!resp.ok) {
      setAccessToken(null);
      return null;
    }

    const data = (await resp.json()) as { accessToken?: string };

    if (!data.accessToken) {
      setAccessToken(null);
      return null;
    }

    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function attemptRefresh(): Promise<string | null> {
  mutex ??= (async (): Promise<string | null> => {
    try {
      return await refreshInner();
    } finally {
      mutex = null;
    }
  })();

  return mutex;
}
