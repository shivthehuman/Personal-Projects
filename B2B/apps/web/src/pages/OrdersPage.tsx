import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { listOrders } from "../api/orders";
import { fetchMe } from "../api/profile.api";

type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered";

function statusClasses(status: string): string {
  if (status === "Delivered")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Shipped") return "bg-blue-100 text-blue-800 border-blue-200";
  if (status === "Confirmed")
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function statusIcon(status: string): string {
  if (status === "Delivered") return "✅";
  if (status === "Shipped") return "🚚";
  if (status === "Confirmed") return "📋";
  return "⏳";
}

export function OrdersPage(): ReactElement {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const isSeller = meQuery.data?.user.role === "seller";
  const [view, setView] = useState<"buyer" | "seller">("buyer");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const activeView: "buyer" | "seller" = isSeller ? view : "buyer";

  const ordersQuery = useQuery({
    queryKey: ["orders", activeView],
    queryFn: () => listOrders(activeView),
  });

  const statuses: OrderStatus[] = ["Pending", "Confirmed", "Shipped", "Delivered"];

  const filteredOrders = ordersQuery.data
    ? statusFilter === "all"
      ? ordersQuery.data
      : ordersQuery.data.filter((order) => order.status === statusFilter)
    : [];

  const statusCounts = {
    all: ordersQuery.data?.length || 0,
    Pending: ordersQuery.data?.filter((o) => o.status === "Pending").length || 0,
    Confirmed:
      ordersQuery.data?.filter((o) => o.status === "Confirmed").length || 0,
    Shipped: ordersQuery.data?.filter((o) => o.status === "Shipped").length || 0,
    Delivered:
      ordersQuery.data?.filter((o) => o.status === "Delivered").length || 0,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">Track and manage your orders</p>
        </div>
        {isSeller && (
          <div className="inline-flex rounded-xl border border-border bg-white p-1">
            <button
              type="button"
              onClick={() => setView("buyer")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeView === "buyer"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              My Purchases
            </button>
            <button
              type="button"
              onClick={() => setView("seller")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeView === "seller"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              My Sales
            </button>
          </div>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`whitespace-nowrap px-4 py-2 rounded-xl font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({statusCounts.all})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
              statusFilter === status
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span>{statusIcon(status)}</span>
            <span>
              {status} ({statusCounts[status]})
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {ordersQuery.isLoading && (
        <div className="rounded-xl border border-border bg-white app-card text-center py-12">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      )}

      {/* Error State */}
      {ordersQuery.isError && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">Could not load orders</p>
          <p className="text-sm mt-1">Please try again later.</p>
        </div>
      )}

      {/* Empty State */}
      {ordersQuery.data && filteredOrders.length === 0 && (
        <div className="rounded-xl border border-border bg-white app-card text-center py-12">
          <p className="text-lg text-gray-600 mb-2">No orders found</p>
          <p className="text-sm text-gray-500">
            {statusFilter === "all"
              ? "Start shopping to see your orders here"
              : `No orders with status "${statusFilter}"`}
          </p>
        </div>
      )}

      {/* Orders List */}
      {ordersQuery.data && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl border border-border bg-white overflow-hidden shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    {activeView === "seller" ? "Buyer" : "Seller"}
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-900">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => {
                  const product =
                    typeof order.productId === "object" &&
                    order.productId !== null
                      ? order.productId
                      : undefined;
                  const party =
                    activeView === "seller"
                      ? typeof order.buyerId === "object" &&
                        order.buyerId !== null
                        ? order.buyerId
                        : undefined
                      : typeof order.sellerId === "object" &&
                          order.sellerId !== null
                        ? order.sellerId
                        : undefined;
                  const image = product?.documents?.[0]?.url;

                  return (
                    <tr key={order._id ?? order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={product?.name ?? "Product"}
                              className="h-10 w-10 rounded-md object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                              📦
                            </div>
                          )}
                          <span className="font-medium text-gray-900">
                            {product?.name ?? "Product"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {party?.legalName || "Party"}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(
                            order.status
                          )}`}
                        >
                          <span>{statusIcon(order.status)}</span>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">
                        {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const product =
                typeof order.productId === "object" &&
                order.productId !== null
                  ? order.productId
                  : undefined;
              const party =
                activeView === "seller"
                  ? typeof order.buyerId === "object" && order.buyerId !== null
                    ? order.buyerId
                    : undefined
                  : typeof order.sellerId === "object" &&
                      order.sellerId !== null
                    ? order.sellerId
                    : undefined;
              const image = product?.documents?.[0]?.url;

              return (
                <div
                  key={order._id ?? order.id}
                  className="rounded-xl border border-border bg-white app-card space-y-3"
                >
                  <div className="flex items-start gap-3">
                    {image ? (
                      <img
                        src={image}
                        alt={product?.name ?? "Product"}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-lg">
                        📦
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {product?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-gray-600">
                        from {party?.legalName || "Party"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600">Amount</p>
                      <p className="font-semibold text-gray-900">
                        ₹{order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                          order.status
                        )}`}
                      >
                        <span>{statusIcon(order.status)}</span>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
