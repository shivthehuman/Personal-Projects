import { useQuery } from "@tanstack/react-query";
// removed direct placeOrder mutation; using cart add then checkout
import type { ReactElement } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRef } from "react";

import { fetchProductById } from "../api/products";
import { getHttpErrorMessage } from "../lib/errors";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { getGoogleMapsApiKey } from "../lib/env";
import { useCart } from "../contexts/CartContext";
import { useState } from "react";

export function ProductDetailsPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id!),
    enabled: Boolean(id),
  });

  const product = productQuery.data;
  const isLoading = productQuery.isLoading;
  const isError = productQuery.isError;

  const sellerName =
    typeof product?.sellerId === "object" && product?.sellerId !== null
      ? product.sellerId.legalName
      : String(product?.sellerId ?? "Unknown seller");

  const sellerOrg =
    typeof product?.sellerId === "object" && product?.sellerId !== null ? product.sellerId : null;

  const googleMapsApiKey = getGoogleMapsApiKey();
  const { isLoaded: mapLoaded } = useJsApiLoader({ googleMapsApiKey });

  const { addItem } = useCart();

  function handleContactSeller(): void {
    if (!product) return;

    const sellerPhone = (sellerOrg as any)?.phone;
    const sellerEmail = (sellerOrg as any)?.email;

    if (sellerPhone) {
      const cleanPhone = sellerPhone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hi, I am interested in your ${product.name} listed on B2B Marketplace.`
      )}`;
      window.open(whatsappUrl, "_blank");
    } else if (sellerEmail) {
      window.location.href = `mailto:${sellerEmail}?subject=${encodeURIComponent(
        `Inquiry for ${product.name}`
      )}`;
    } else {
      alert("No contact information available for this seller.");
    }
  }

  function handlePlaceOrder(): void {
    if (!product) return;

    if (quantity < product.moq) {
      window.alert(`Please enter a valid quantity (minimum ${product.moq}).`);
      return;
    }

    const total = quantity * Number(product.pricePerUnit);
    const confirmOrder = window.confirm(
      `Place order for ${quantity} ${product.unit} at total ₹${total.toFixed(2)}?`
    );
    if (!confirmOrder) return;

    const productId = product._id ?? product.id;
    if (!productId) {
      window.alert("Product id is missing.");
      return;
    }

    addItem({
      productId: String(productId),
      name: product.name,
      sellerName,
      sellerId: typeof product.sellerId === "object" && product.sellerId !== null ? (product.sellerId._id ?? product.sellerId.id ?? String(product.sellerId)) : String(product.sellerId ?? ""),
      quantity,
      unit: product.unit,
      pricePerUnit: Number(product.pricePerUnit),
      moq: product.moq,
    });

    setToastMessage("Added to cart");
    window.setTimeout(() => setToastMessage(null), 1600);
    navigate("/checkout");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-96 animate-pulse rounded-2xl border border-border bg-white" />
        <div className="h-60 animate-pulse rounded-2xl border border-border bg-white" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-800">
          <div className="font-semibold">Could not load product details.</div>
          <div className="mt-1">{getHttpErrorMessage(productQuery.error, "Unexpected error.")}</div>
          <button
            type="button"
            className="mt-3 rounded-xl border border-red-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalPrice = quantity * Number(product.pricePerUnit);

  return (
    <div className="space-y-8">
      {toastMessage ? (
        <div className="fixed right-4 top-20 z-[70] rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow">
          {toastMessage}
        </div>
      ) : null}

      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm font-medium text-grayText hover:text-darkText transition-colors flex items-center gap-1"
      >
        ← Back
      </button>

      {/* ===== SECTION 1: IMAGE GALLERY + PRODUCT INFO ===== */}
      <section className="grid gap-8 lg:grid-cols-5">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-2xl border border-border bg-lightGreen/40 overflow-hidden">
            <div className="aspect-square flex items-center justify-center text-6xl">📦</div>
            <div className="p-4 space-y-2 border-t border-border">
              <button
                type="button"
                onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="w-full py-2 rounded-lg border border-border text-sm font-medium text-darkText hover:bg-white transition-colors"
              >
                View all images (3)
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full py-2 rounded-lg border border-primary text-sm font-medium text-primary hover:bg-lightGreen transition-colors"
              >
                ♡ Add to Wishlist
              </button>
            </div>
          </div>
        </div>

        {/* Right: Product Info + Quantity Selector + CTAs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Product Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-4xl font-extrabold text-darkText">{product.name}</h1>
                
                {/* Seller + Verification */}
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-grayText">by {sellerName}</p>
                  {sellerOrg?.verificationStatus === "Verified" && (
                    <span className="text-sm font-bold text-emerald-600">✅ Verified</span>
                  )}
                </div>
              </div>
            </div>

            {/* MOQ WARNING BANNER */}
            <div className="mt-4 rounded-lg bg-yellow-100 border border-yellow-300 px-4 py-3">
              <p className="text-sm font-bold text-yellow-900">
                🔔 Minimum Order: <span className="text-lg">{product.moq} {product.unit}</span>
              </p>
              <p className="text-xs text-yellow-800 mt-1">You must order at least this quantity</p>
            </div>

            {/* Trust Badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-lightGreen px-3 py-1.5 text-xs font-semibold text-primary">
                ⚡ Fast Response
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-lightGreen px-3 py-1.5 text-xs font-semibold text-primary">
                ⭐ 4.8 Rating (120 reviews)
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="rounded-2xl border border-border bg-background p-6 space-y-4">
            <div>
              <span className="text-5xl font-extrabold text-primary">₹{product.pricePerUnit}</span>
              <span className="ml-2 text-lg text-grayText">per {product.unit}</span>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-bold text-darkText mb-3">
                Select Quantity (Min: {product.moq} {product.unit})
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (quantity <= product.moq) {
                      setToastMessage(`⚠️ Minimum order is ${product.moq} ${product.unit}`);
                      setTimeout(() => setToastMessage(null), 2000);
                    } else {
                      setQuantity(quantity - 1);
                    }
                  }}
                  disabled={quantity <= product.moq}
                  className={`h-12 w-12 rounded-lg border font-bold text-lg transition-colors ${
                    quantity <= product.moq
                      ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-border bg-white text-darkText hover:bg-lightGreen"
                  }`}
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const newVal = Math.max(product.moq, Number(e.target.value) || product.moq);
                    setQuantity(newVal);
                  }}
                  className="h-12 flex-1 rounded-lg border border-border px-4 py-3 text-center font-bold text-lg text-darkText outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-12 w-12 rounded-lg border border-border bg-white font-bold text-lg text-darkText hover:bg-lightGreen transition-colors"
                >
                  +
                </button>
              </div>
              {quantity < product.moq && (
                <p className="mt-2 text-xs text-red-600 font-semibold">⚠️ Quantity must be at least {product.moq}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-grayText">Unit Price</span>
                <span className="font-semibold text-darkText">₹{product.pricePerUnit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-grayText">Quantity</span>
                <span className="font-semibold text-darkText">{quantity} {product.unit}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold text-lg">
                <span className="text-darkText">Total</span>
                <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handlePlaceOrder}
                className="btn-primary w-full py-3"
              >
                🛒 Add to Cart & Checkout
              </button>
              <button
                type="button"
                onClick={handleContactSeller}
                className="w-full rounded-xl border border-primary bg-white px-4 py-3 font-medium text-primary hover:bg-lightGreen transition-colors"
              >
                💬 Contact Seller
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="font-bold text-darkText">Product Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-grayText">Minimum Order</p>
                <p className="mt-1 text-lg font-bold text-darkText">{product.moq} {product.unit}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-grayText">Stock Status</p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {typeof product.stock === "number"
                    ? product.stock > 0
                      ? `✓ ${product.stock} in stock`
                      : "Out of stock"
                    : "Stock details unavailable"}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-grayText">{product.description}</p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: TRUST & SELLER INFO ===== */}
      <section className="rounded-2xl border border-border bg-background p-6 space-y-6">
        <h2 className="text-xl font-bold text-darkText">About the Seller</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Seller Card */}
          <div className="rounded-xl border border-border bg-lightGreen/40 p-4 text-center">
            <div className="text-4xl mb-2">🏢</div>
            <p className="font-bold text-darkText">{sellerName}</p>
            <p className="text-xs text-grayText mt-1">
              {sellerOrg?.verificationStatus ?? "Supplier"}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/dashboard?q=${encodeURIComponent(sellerName)}`)}
              className="mt-3 w-full rounded-lg bg-white border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-lightGreen transition-colors"
            >
              View Store
            </button>
          </div>

          {/* Trust Metrics */}
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-grayText">Response Time</p>
            <p className="mt-2 text-2xl font-bold text-primary">2 hrs</p>
            <p className="text-xs text-grayText mt-1">Avg. response</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-grayText">Seller Rating</p>
            <p className="mt-2 text-2xl font-bold text-primary">4.8 ⭐</p>
            <p className="text-xs text-grayText mt-1">From 120 orders</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-xs text-grayText">On-time Delivery</p>
            <p className="mt-2 text-2xl font-bold text-primary">98%</p>
            <p className="text-xs text-grayText mt-1">Success rate</p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: LOCATION & MAP ===== */}
      {sellerOrg?.location && (
        <section ref={mapSectionRef} className="rounded-2xl border border-border bg-background p-6 space-y-4">
          <h2 className="text-xl font-bold text-darkText">Location & Distance</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-grayText">Seller Headquarters</p>
              <p className="mt-2 font-semibold text-darkText">
                Lat: {sellerOrg.location.coordinates[1].toFixed(4)}° | Lng: {sellerOrg.location.coordinates[0].toFixed(4)}°
              </p>
              {product.distance !== undefined && (
                <>
                  <p
                    onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-2 text-lg font-bold text-primary cursor-pointer hover:underline transition-all"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        mapSectionRef.current?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    📍 {product.distance.toFixed(1)} km from you
                  </p>
                  <p className="text-xs text-primary mt-0.5">Click to view map →</p>
                </>
              )}
            </div>
            <div>
              {mapLoaded ? (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "200px", borderRadius: "12px" }}
                  center={{ lat: sellerOrg.location.coordinates[1], lng: sellerOrg.location.coordinates[0] }}
                  zoom={14}
                  options={{ disableDefaultUI: true }}
                >
                  <Marker position={{ lat: sellerOrg.location.coordinates[1], lng: sellerOrg.location.coordinates[0] }} />
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-48 bg-lightGreen/40 rounded-lg text-sm text-grayText">
                  Loading map...
                </div>
              )}
            </div>
          </div>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.google.com/maps/dir/?api=1&destination=${sellerOrg.location.coordinates[1]},${sellerOrg.location.coordinates[0]}`}
            className="inline-block rounded-xl bg-primary text-white px-6 py-2 font-medium hover:bg-green-600 transition-colors"
          >
            ➜ Get Directions
          </a>
        </section>
      )}

      {/* ===== SECTION 4: TRANSPORT OPTIONS ===== */}
      <section className="rounded-2xl border border-border bg-background p-6 space-y-4">
        <h2 className="text-xl font-bold text-darkText">Delivery & Transport</h2>
        <div className="space-y-3">
          {[
            { name: "Standard Delivery", eta: "3-5 days", price: 500, time: "Fastest" },
            { name: "Express Delivery", eta: "1-2 days", price: 1200, time: "Express" },
            { name: "Same Day Delivery", eta: "Today", price: 2500, time: "Premium" },
          ].map((option, idx) => (
            <label
              key={idx}
              className="flex items-center gap-3 rounded-lg border border-border bg-lightGreen/20 p-4 cursor-pointer hover:border-primary transition-colors"
            >
              <input type="radio" name="transport" defaultChecked={idx === 0} className="w-4 h-4" />
              <div className="flex-1">
                <p className="font-medium text-darkText">{option.name}</p>
                <p className="text-xs text-grayText">ETA: {option.eta}</p>
              </div>
              <p className="font-bold text-primary">₹{option.price}</p>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
