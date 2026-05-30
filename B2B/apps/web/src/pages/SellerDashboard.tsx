import type { ReactElement } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe } from "../api/profile.api";
import { listOrders, updateOrderStatus } from "../api/orders";
import { listProducts } from "../api/products";

interface KPIWidget {
  label: string;
  value: string | number;
  trend?: string;
  icon: string;
  color: string;
}

export function SellerDashboard(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const [showQuickAction, setShowQuickAction] = useState<"add" | "update" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const owner = meQuery.data?.organization.id || meQuery.data?.organization._id;

  const ordersQuery = useQuery({
    queryKey: ["orders", "seller", owner],
    queryFn: () => listOrders("seller"),
    enabled: !!owner,
  });

  const productsQuery = useQuery({
    queryKey: ["products", owner],
    queryFn: () => listProducts(owner, 0, 100),
    enabled: !!owner,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: "Pending" | "Accepted" | "Packed" | "Delivered" }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      setToastMessage("✅ Order status updated");
      setUpdatingOrderId(null);
      setTimeout(() => setToastMessage(null), 2000);
      void queryClient.invalidateQueries({ queryKey: ["orders", "seller", owner] });
    },
    onError: (error: any) => {
      setToastMessage(`❌ ${error.response?.data?.formErrors?.[0] || "Failed to update status"}`);
      setTimeout(() => setToastMessage(null), 2500);
    },
  });

  // Calculate KPIs from mock/real data
  const orders = ordersQuery.data || [];
  const products = productsQuery.data || [];

  const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending" || o.status === "Accepted").length;
  const inventoryValue = products.reduce((sum, p) => sum + (p.pricePerUnit || 0), 0);
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const kpis: KPIWidget[] = [
    {
      label: "Total Sales",
      value: `₹${totalSales.toLocaleString()}`,
      trend: "+12% from last month",
      icon: "💰",
      color: "bg-primary/10 border-primary/30",
    },
    {
      label: "Pending Orders",
      value: pendingOrders,
      trend: `${pendingOrders} to fulfil`,
      icon: "📋",
      color: "bg-amber-50 border-amber-200",
    },
    {
      label: "Inventory Value",
      value: `₹${inventoryValue.toLocaleString()}`,
      trend: `${products.length} active products`,
      icon: "📦",
      color: "bg-blue-50 border-blue-200",
    },
    {
      label: "Revenue Trend",
      value: "+8.2%",
      trend: "vs last month",
      icon: "📈",
      color: "bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed right-4 top-20 z-[70] rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {meQuery.data?.user.name || "Seller"}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's your wholesale control center.</p>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => navigate("/seller/inventory")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary text-white hover:bg-green-700 transition-colors font-medium"
        >
          <span className="text-2xl">➕</span>
          <span className="text-sm">Add Product</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/seller/inventory")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/30"
        >
          <span className="text-2xl">🔄</span>
          <span className="text-sm">Update Stock</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/seller/orders")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/30"
        >
          <span className="text-2xl">📦</span>
          <span className="text-sm">Pending</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/seller/analytics")}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/30"
        >
          <span className="text-2xl">📊</span>
          <span className="text-sm">Analytics</span>
        </button>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-xl border p-6 ${kpi.color} app-card`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {kpi.value}
                  </span>
                </div>
                {kpi.trend && (
                  <p className="mt-2 text-xs text-gray-600">{kpi.trend}</p>
                )}
              </div>
              <span className="text-3xl">{kpi.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity / Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button
              type="button"
              onClick={() => navigate("/seller/orders")}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all →
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders yet. Start building your business!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => {
                const statusProgression: Record<string, "Pending" | "Accepted" | "Packed" | "Delivered" | null> = {
                  "Pending": "Accepted",
                  "Accepted": "Packed",
                  "Packed": "Delivered",
                  "Delivered": null,
                };
                const nextStatus = statusProgression[order.status];
                const statusColors: Record<string, string> = {
                  "Delivered": "bg-emerald-100 text-emerald-800",
                  "Packed": "bg-blue-100 text-blue-800",
                  "Accepted": "bg-amber-100 text-amber-800",
                  "Pending": "bg-gray-100 text-gray-800",
                };

                return (
                  <div
                    key={order._id}
                    className="flex items-center justify-between p-3 bg-lightGreen/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Order #{order._id?.slice(-6)}</p>
                      <p className="text-sm text-gray-600">
                        ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {order.status}
                      </span>

                      {nextStatus && (
                        <button
                          type="button"
                          disabled={updatingOrderId === order._id || updateStatusMutation.isPending}
                          onClick={() => {
                            setUpdatingOrderId(order._id ?? "");
                            updateStatusMutation.mutate({ 
                              orderId: order._id ?? "", 
                              status: nextStatus 
                            });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingOrderId === order._id ? "⏳" : "→"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-xl border border-border bg-white app-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Products</h2>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Add products to get started
              </p>
              <button
                type="button"
                onClick={() => navigate("/seller/inventory")}
                className="mt-3 text-sm text-primary hover:underline font-medium"
              >
                Add Product →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 5).map((product) => {
                const moq = product.moq || 1;
                const stock = product.stock || 0;
                const lowStockThreshold = moq * 0.2; // 20% of MOQ
                const isLowStock = stock < lowStockThreshold;

                return (
                  <div
                    key={product._id}
                    className={`p-3 rounded-lg border ${
                      isLowStock
                        ? "bg-red-50 border-red-200"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{product.name}</p>
                        {isLowStock && (
                          <p className="text-xs font-bold text-red-700 mt-1">
                            ⚠️ Low Stock Alert
                          </p>
                        )}
                      </div>
                      {isLowStock && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800 whitespace-nowrap">
                          📉 {stock}/{moq}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-600">
                        Stock: {stock} / {moq} MOQ
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        ₹{product.pricePerUnit}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
