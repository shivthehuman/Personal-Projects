import type { ReactElement } from "react";

type MapModalProps = {
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  title?: string;
};

export function MapModal({ open, onClose, lat, lng, title }: MapModalProps): ReactElement | null {
  if (!open) return null;

  const apiKey = (import.meta as any).env?.VITE_MAP_API_KEY || "";
  const src = apiKey
    ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(apiKey)}&center=${lat},${lng}&zoom=15`
    : `https://www.google.com/maps?q=${lat},${lng}&output=embed`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-[90%] max-w-2xl rounded-xl overflow-hidden bg-white">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="font-semibold">{title ?? "Location"}</div>
          <button onClick={onClose} className="text-sm text-grayText">Close</button>
        </div>
        <div className="h-96">
          <iframe
            title="map"
            src={src}
            width="100%"
            height="100%"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}

export default MapModal;
