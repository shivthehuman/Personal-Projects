import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { fetchMe } from "../api/profile.api";

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

interface SidebarLayoutProps {
  children: ReactNode;
}

const SELLER_NAV: NavItem[] = [
  { label: "Dashboard", icon: "📊", href: "/seller/dashboard" },
  { label: "Inventory", icon: "📦", href: "/seller/inventory" },
  { label: "Orders", icon: "🛒", href: "/seller/orders" },
  { label: "Logistics", icon: "🚚", href: "/seller/orders" },
  { label: "Analytics", icon: "📈", href: "/seller/dashboard" },
  { label: "Settings", icon: "⚙️", href: "/profile" },
];

const BUYER_NAV: NavItem[] = [
  { label: "Dashboard", icon: "🏠", href: "/buyer/dashboard" },
  { label: "Orders", icon: "📋", href: "/buyer/orders" },
  { label: "Saved Suppliers", icon: "⭐", href: "/dashboard" },
];

export function SidebarLayout({ children }: SidebarLayoutProps): ReactElement {
  const navigate = useNavigate();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = meQuery.data?.user.role || "buyer";
  const navItems = role === "seller" ? SELLER_NAV : BUYER_NAV;
  const currentPath = window.location.pathname;

  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + "/");

  return (
    <div className="flex h-screen bg-white">
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-border transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">
              {role === "seller" ? "Seller Hub" : "Buyer Hub"}
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => {
                  navigate(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-lightGreen/50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="border-t border-border p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-900 mb-1">
              {meQuery.data?.organization?.legalName || "Organization"}
            </div>
            <div className="text-gray-600 capitalize">
              {role === "seller" ? "Seller Account" : "Buyer Account"}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden bg-white border-b border-border px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-primary font-bold text-lg"
          >
            ☰
          </button>
          <span className="text-sm font-semibold text-gray-700">
            {role === "seller" ? "Seller Hub" : "Buyer Hub"}
          </span>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
