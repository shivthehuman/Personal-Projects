export function getApiOrigin(): string {
  return import.meta.env.VITE_API_ORIGIN ?? "/api";
}

export function getVapidPublicKey(): string {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
  return key ?? "";
}

export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  return key ?? "";
}
