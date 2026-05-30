import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { fetchMe } from "../api/profile.api";
import { listOrders } from "../api/orders";
import { getNearbyProducts } from "../api/products";

export function BuyerDashboard(): ReactElement {
  const navigate = useNavigate();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  // Get buyer's orders
  const ordersQuery = useQuery({
    queryKey: ["orders", "buyer"],
    queryFn: () => listOrders("buyer"),
  });

  // Get nearby products for suggestions
  const nearbyQuery = useQuery({
    queryKey: ["nearby-products"],
    queryFn: () => {
      const lng = meQuery.data?.location?.coordinates?.[0] || 77.209;
      const lat = meQuery.data?.location?.coordinates?.[1] || 28.6139;
      return getNearbyProducts(lng, lat, 50, undefined, 0, 5);
    },
  });

  const recentOrders = ordersQuery.data || [];
  const suggestedProducts = nearbyQuery.data || [];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {meQuery.data?.user.name || "Buyer"}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Your wholesale marketplace control center.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary text-white hover:bg-green-700 transition-colors font-medium"
        >
          <span className="text-2xl">🔍</span>
          <span className="text-sm">Browse Products</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/cart")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/30"
        >
          <span className="text-2xl">🛒</span>
          <span className="text-sm">My Cart</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/30"
        >
          <span className="text-2xl">⭐</span>
          <span className="text-sm">Saved</span>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button
              type="button"
              onClick={() => navigate("/buyer/orders")}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all →
            </button>
          </div>

          {ordersQuery.isLoading && (
            <div className="text-center py-8 text-gray-500">Loading orders...</div>
          )}

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No orders yet. Start shopping!</p>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-sm text-primary hover:underline font-medium"
              >
                Browse Products →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.slice(0, 5).map((order) => {
                const product =
                  typeof order.productId === "object" && order.productId !== null
                    ? order.productId
                    : undefined;
                const seller =
                  typeof order.sellerId === "object" && order.sellerId !== null
                    ? order.sellerId
                    : undefined;

                return (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-3 bg-lightGreen/30 rounded-lg hover:bg-lightGreen/50 transition-colors cursor-pointer"
                    role="button"
                    onClick={() => navigate("/buyer/orders")}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product?.name || "Product"}
                      </p>
                      <p className="text-xs text-gray-600">
                        from {seller?.legalName || "Seller"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex text-xs font-semibold px-2 py-1 rounded-full mt-1 ${
                          order.status === "Delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "Shipped"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Confirmed"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Nearby Deals / Suggestions */}
        <div className="rounded-xl border border-border bg-white app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Nearby Deals</h2>
          </div>

          {nearbyQuery.isLoading && (
            <div className="text-center py-8 text-gray-500">Loading deals...</div>
          )}

          {suggestedProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No nearby products found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestedProducts.slice(0, 5).map((product) => (
                <div
                  key={product._id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/30 transition-colors cursor-pointer"
                  role="button"
                  onClick={() => navigate(`/product/${product._id}`)}
                >
                  <p className="font-medium text-sm text-gray-900">{product.name}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-600">
                      📍 {product.distance?.toFixed(1) || 0}km away
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      ₹{product.pricePerUnit}
                    </span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full mt-3 py-2 text-sm text-primary hover:bg-lightGreen/30 rounded-lg font-medium transition-colors"
              >
                View all nearby suppliers →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reorder Suggestions */}
      <div className="rounded-xl border border-border bg-white app-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            🔄 Reorder Suggestions
          </h2>
          <p className="text-xs text-gray-600">Based on your purchase history</p>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Your reorder suggestions will appear here after your first purchase.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentOrders.slice(0, 4).map((order) => {
              const product =
                typeof order.productId === "object" && order.productId !== null
                  ? order.productId
                  : undefined;

              return (
                <div
                  key={order._id}
                  className="p-4 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-lightGreen/20 transition-colors cursor-pointer"
                  role="button"
                  onClick={() => navigate(product?._id ? `/product/${product._id}` : "/dashboard")}
                >
                  <div className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    📦
                  </div>
                  <p className="font-medium text-sm text-gray-900">
                    {product?.name || "Product"}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ₹{product?.pricePerUnit || order.totalAmount}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(product?._id ? `/product/${product._id}` : "/dashboard");
                    }}
                    className="w-full mt-3 py-2 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    Reorder
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
