import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api } from "../api/http";
import { getNearbyProducts } from "../api/products";
import { fetchMe } from "../api/profile.api";
import { getHttpErrorMessage } from "../lib/errors";
import { getGoogleMapsApiKey, getVapidPublicKey } from "../lib/env";
import { arrayBufferToBase64, urlBase64ToUint8Array } from "../lib/push-encoding";
import { useAccessToken } from "../lib/token-store";
import { useAuthReady } from "../providers/AppProviders";
import { ProductCard } from "../components/ProductCard";


export function DashboardPage(): ReactElement {
  const ready = useAuthReady();
  const token = useAccessToken();
  const location = useLocation();
  const navigate = useNavigate();
  

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: ready && Boolean(token),
  });

  const vapidConfigured = useMemo(() => getVapidPublicKey().length > 0, []);

  const [nearbyProducts, setNearbyProducts] = useState<any[]>([]);
  const [skip, setSkip] = useState(0);
  const limit = 20;
  
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50);

  const profile = meQuery.data;
  
  const categories = ["Dairy", "Spices", "Electronics", "Textiles", "Produce", "Beverages", "Frozen Food", "Grains"];

  // Read search query directly from URL params
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const q = (searchParams.get("q") || "").trim();
  const categoryParam = (searchParams.get("category") || "").trim();

  async function fetchProducts(query?: string, category?: string): Promise<void> {
    if (!profile) return;

    const [lng, lat] = profile.organization.location.coordinates;
    setSkip(0);
    const products = await getNearbyProducts(lng, lat, undefined, query ?? q, 0, limit, undefined, undefined, category ?? categoryParam ?? undefined);
    setNearbyProducts(products);
  }

  useEffect(() => {
    if (!profile) {
      setNearbyProducts([]);
      return;
    }

    // Amazon-style: only fetch when URL has a query
    if (!q && !categoryParam) {
      setNearbyProducts([]);
      return;
    }

    void fetchProducts(q, categoryParam).catch(() => setNearbyProducts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, q]);

  async function loadMore(): Promise<void> {
    if (!profile) return;
    if (!q && !categoryParam) return;
    const [lng, lat] = profile.organization.location.coordinates;
    const next = await getNearbyProducts(lng, lat, undefined, q, nearbyProducts.length, limit, undefined, undefined, categoryParam || undefined);
    setNearbyProducts((cur) => [...cur, ...next]);
    setSkip((s) => s + next.length);
  }

  // Use backend-provided nearbyProducts (already sorted by distance). No client-side filtering.
  const filteredProducts = nearbyProducts;

  async function handleEnableNotifications(): Promise<void> {
    setPushMessage(null);
    setPushError(null);

    if (!("Notification" in window)) {
      setPushError("Notifications are not supported in this browser.");
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setPushError("Service workers are not available (required for Push).");
      return;
    }

    if (!("PushManager" in window)) {
      setPushError("Web Push is not supported in this browser.");
      return;
    }

    const vapidPublic = getVapidPublicKey().trim();
    if (!vapidPublic) {
      setPushError(
        'Missing `VITE_VAPID_PUBLIC_KEY`. Generate keys with `npx web-push generate-vapid-keys` and paste the public key into `apps/web/.env.development`.'
      );
      return;
    }

    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushError("Notification permission was denied.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });

      const json = subscription.toJSON();
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;

      if (!p256dh || !auth) {
        throw new Error("Push subscription did not include encryption keys.");
      }

      await api.post("/push/subscribe", {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth),
        },
      });

      setPushMessage("Web Push subscription saved (server-side persistence).");
    } catch (error: unknown) {
      setPushError(getHttpErrorMessage(error, "Could not enable notifications."));
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Notification messages */}
      {pushMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {pushMessage}
        </div>
      ) : null}
      {pushError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {pushError}
        </div>
      ) : null}

      {meQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 animate-pulse rounded-xl border border-border bg-white" />
          <div className="h-44 animate-pulse rounded-xl border border-border bg-white" />
        </div>
      ) : null}

      {meQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="font-semibold">Could not load your profile.</div>
          <div className="mt-1">{getHttpErrorMessage(meQuery.error, "Unexpected error.")}</div>
          <button
            type="button"
            className="mt-3 rounded-xl border border-red-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
            onClick={() => void meQuery.refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {profile && !q ? (
        <div className="space-y-12">
          {/* ===== SECTION 1: HERO ===== */}
          <section className="rounded-2xl bg-gradient-to-br from-primary/10 to-lightGreen px-6 py-16 text-center md:px-12">
            <h1 className="text-4xl font-extrabold text-darkText md:text-5xl">
              Find & Buy Wholesale Products
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-grayText">
              Connect with trusted suppliers, compare prices, and order in bulk—all in one platform.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-grayText">Use the global search in the header to search across products and suppliers.</p>
          </section>

          {/* ===== SECTION 2: CATEGORIES GRID ===== */}
          <section>
            <h2 className="text-2xl font-bold text-darkText mb-6">Popular Categories</h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {categories.slice(0, 8).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    // update selected categories state and navigate with category param
                    setSelectedCategories([cat]);
                    navigate(`/dashboard?category=${encodeURIComponent(cat)}`);
                  }}
                  className="flex flex-col items-center justify-center rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary hover:shadow-lg"
                >
                  <span className="text-3xl mb-2">
                    {cat === "Dairy" && "🥛"}
                    {cat === "Spices" && "🌶️"}
                    {cat === "Electronics" && "🔌"}
                    {cat === "Textiles" && "🧵"}
                    {cat === "Produce" && "🥬"}
                    {cat === "Beverages" && "🥤"}
                    {cat === "Frozen Food" && "🧊"}
                    {cat === "Grains" && "🌾"}
                  </span>
                  <p className="text-sm font-medium text-darkText">{cat}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ===== SECTION 3: NEARBY WHOLESALERS (Horizontal Scroll) ===== */}
          <section>
            <h2 className="text-2xl font-bold text-darkText mb-6">Top Wholesalers Near You</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[
                { name: "Fresh Foods Ltd", distance: "2.3 km", verified: true, delivery: "Same day" },
                { name: "Spice Masters", distance: "4.1 km", verified: true, delivery: "Next day" },
                { name: "Tech Wholesale", distance: "6.8 km", verified: false, delivery: "2-3 days" },
                { name: "Textile Hub", distance: "3.5 km", verified: true, delivery: "Same day" },
              ].map((seller, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 w-72 rounded-2xl border border-border bg-background p-5 shadow-card"
                >
                  <div className="aspect-square rounded-xl bg-lightGreen/40 flex items-center justify-center mb-4 text-4xl">
                    🏢
                  </div>
                  <h3 className="font-bold text-darkText">{seller.name}</h3>
                  <div className="mt-3 space-y-2 text-sm text-grayText">
                    <p>📍 {seller.distance}</p>
                    <p>🚚 {seller.delivery}</p>
                    {seller.verified ? (
                      <p className="text-primary font-medium">✅ Verified Seller</p>
                    ) : null}
                  </div>
                  <button className="btn-primary mt-4 w-full px-4 py-3 text-sm font-bold">
                    View Products →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 4: HOW IT WORKS ===== */}
          <section className="rounded-2xl bg-lightGreen/40 p-8">
            <h2 className="text-2xl font-bold text-darkText mb-10 text-center">How It Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                { step: "1", title: "Find Suppliers", desc: "Search for products and browse verified wholesalers near you." },
                { step: "2", title: "Compare & Order", desc: "Compare prices, MOQ, and delivery times. Place bulk orders instantly." },
                { step: "3", title: "Get Delivered", desc: "Track your order and get it delivered directly to your business." },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-darkText">{item.title}</h3>
                  <p className="mt-2 text-sm text-grayText">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {profile && q ? (
        <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-5">
          {/* ===== DESKTOP SIDEBAR FILTER ===== */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-6 rounded-2xl border border-border bg-background p-5 shadow-card">
              <div>
                <h3 className="font-bold text-darkText mb-3">Filters</h3>
                <button
                  type="button"
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setSelectedCategories([]);
                    setShowVerifiedOnly(false);
                    setMaxDistance(50);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>

              {/* Distance Filter */}
              <div>
                <label className="block text-sm font-medium text-darkText mb-3">
                  Max Distance: {maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-darkText mb-3">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    placeholder="Min"
                    className="w-full rounded-lg border border-border px-3 py-3 text-sm"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    placeholder="Max"
                    className="w-full rounded-lg border border-border px-3 py-3 text-sm"
                  />
                </div>
              </div>

              {/* Verified Only */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showVerifiedOnly}
                  onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-darkText">Verified Sellers Only</span>
              </label>

              {/* Category Filter */}
              <div>
                <p className="text-sm font-medium text-darkText mb-3">Categories</p>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, cat]);
                          } else {
                            setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-darkText">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ===== MAIN RESULTS GRID ===== */}
          <main className="md:col-span-3 lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-darkText">Search Results</h2>
                <p className="text-sm text-grayText">Showing {filteredProducts.length} products for "{q}"</p>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-darkText"
              >
                {sidebarOpen ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            {/* Mobile Filters (Collapsible) */}
            {sidebarOpen ? (
              <div className="mb-6 rounded-2xl border border-border bg-background p-5 md:hidden">
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-darkText">Verified Only</span>
                  </label>
                  <label className="text-sm text-darkText">
                    Distance: {maxDistance} km
                    <input type="range" min="1" max="100" value={maxDistance} onChange={(e) => setMaxDistance(Number(e.target.value))} className="w-full mt-1" />
                  </label>
                </div>
              </div>
            ) : null}

            {/* Product Grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-border bg-lightGreen/20 px-8 py-12 text-center">
                  <p className="text-lg font-medium text-darkText">No products found</p>
                  <p className="mt-2 text-sm text-grayText">Try adjusting your filters or search query</p>
                </div>
              ) : null}

              {filteredProducts.map((product) => {
                const sellerName =
                  typeof product.sellerId === "object" && product.sellerId !== null
                    ? product.sellerId.legalName
                    : String(product.sellerId ?? "Unknown seller");

                const productId = (product as any)._id || product.id;

                return (
                  <ProductCard
                    key={String(productId)}
                    productId={String(productId)}
                    name={product.name}
                    description={product.description}
                    sellerName={sellerName}
                    sellerId={
                      typeof product.sellerId === "object" && product.sellerId !== null
                        ? (product.sellerId._id ?? product.sellerId.id ?? String(product.sellerId))
                        : String(product.sellerId ?? "")
                    }
                    price={product.pricePerUnit}
                    unit={product.unit}
                    moq={product.moq}
                    distance={product.distance}
                    location={product.location}
                    stock={product.stock}
                    isVerified={product.verified}
                  />
                );
              })}
            </div>

            {/* Load More */}
            {filteredProducts.length >= limit ? (
              <div className="mt-8 text-center">
                <button
                  onClick={() => void loadMore()}
                  className="btn-primary px-8 py-3 font-medium"
                >
                  Load More Products
                </button>
              </div>
            ) : null}
          </main>
        </div>
      ) : null}
    </div>
  );
}
