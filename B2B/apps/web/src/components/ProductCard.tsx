import type { ReactElement, MouseEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { MapModal } from "./MapModal";

type ProductCardProps = {
  productId: string;
  name: string;
  description: string;
  sellerName: string;
  sellerId?: string;
  price: number;
  unit: string;
  moq: number;
  distance?: number;
  stock?: number;
  isVerified?: boolean;
  location?: { type: string; coordinates: [number, number] } | null;
};

export function ProductCard({
  productId,
  name,
  description,
  sellerName,
  sellerId,
  price,
  unit,
  moq,
  distance,
  stock,
  isVerified,
  location,
}: ProductCardProps): ReactElement {
  const { addItem } = useCart();
  const [mapOpen, setMapOpen] = useState(false);

  function handleAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId,
      name,
      sellerName,
      sellerId: sellerId ?? "",
      quantity: moq,
      unit,
      pricePerUnit: price,
      moq,
    });
  }

  return (
    <Link to={`/product/${productId}`}>
      <article className="group rounded-2xl border border-border bg-background p-5 shadow-card transition-all hover:shadow-lg hover:border-primary/30 h-full flex flex-col cursor-pointer">
        {/* Card Top: Image & Wishlist */}
        <div className="relative mb-4 aspect-video w-full rounded-xl bg-lightGreen/40 flex items-center justify-center overflow-hidden">
          <span className="text-5xl opacity-50">📦</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
            aria-label="Add to wishlist"
          >
            ♡
          </button>
        </div>

        {/* Card Center: Product Name, Seller, Price, MOQ, Stock */}
        <div className="flex-1">
          <h3 className="line-clamp-2 text-lg font-bold text-darkText">{name}</h3>
          
          {/* Seller + Verification */}
          <div className="mt-1 flex items-center gap-1">
            <p className="text-xs text-grayText">by {sellerName}</p>
            {isVerified ? (
              <span className="text-xs font-bold text-emerald-600">✅</span>
            ) : null}
          </div>
          
          <p className="mt-2 line-clamp-2 text-sm text-grayText leading-snug">{description}</p>

          {/* Distance Badge - PROMINENT */}
          {distance !== undefined ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (location && location.coordinates && location.coordinates.length === 2) {
                    setMapOpen(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-1.5 font-bold text-emerald-700"
              >
                <span className="text-lg">📍</span>
                <span>{distance.toFixed(1)} km away</span>
              </button>
            </div>
          ) : null}

          {/* Price & MOQ Section */}
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-primary">₹{price}</span>
              <span className="text-xs text-grayText">per {unit}</span>
            </div>

            {/* MOQ Tag - BOLD & PROMINENT */}
            <div className="inline-block rounded-lg bg-yellow-100 px-3 py-1.5 font-bold text-yellow-800">
              🔔 Min. Order: {moq} {unit}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-semibold text-grayText">Unit</p>
                <p className="font-bold text-darkText capitalize">{unit}</p>
              </div>
              {stock !== undefined ? (
                <div>
                  <p className="font-semibold text-grayText">Stock</p>
                  <p className="font-bold text-darkText">{stock > 0 ? "✓" : "—"}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Card Bottom: CTA */}
        <div className="mt-4 space-y-3 border-t border-border pt-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-darkText hover:bg-lightGreen transition-colors"
            >
              + Add
            </button>

            <button
              type="button"
              className="btn-primary flex-1 px-3 py-3 text-sm font-bold"
            >
              View Details →
            </button>
          </div>
        </div>
        {mapOpen && location && location.coordinates && (
          <MapModal
            open={mapOpen}
            onClose={() => setMapOpen(false)}
            lat={location.coordinates[1]}
            lng={location.coordinates[0]}
            title={name}
          />
        )}
      </article>
    </Link>
  );
}
