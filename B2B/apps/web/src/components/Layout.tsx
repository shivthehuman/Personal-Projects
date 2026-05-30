import type { ReactElement, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { logoutRequest } from "../api/auth.api";
import { fetchMe } from "../api/profile.api";

type LayoutProps = {
  children: ReactElement;
};

const locations = ["Auto-detect", "Delhi", "Mumbai", "Bengaluru", "Kolkata"];

export function Layout({ children }: LayoutProps): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [profileOpen, setProfileOpen] = useState(false);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const profile = meQuery.data;
  const organizationName = profile?.organization?.legalName || "Business Account";
  const roleLabel = profile?.user?.role || "member";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearchQuery(q);
  }, [location.search]);

  async function handleSignOut(): Promise<void> {
    await logoutRequest();
    navigate("/login", { replace: true });
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/dashboard?q=${encodeURIComponent(query)}` : "/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-darkText">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 shadow-sm"
            aria-label="Go to dashboard"
          >
            <span className="text-xl" aria-hidden="true">🌿</span>
            <div className="text-left leading-tight">
              <p className="text-xs font-semibold uppercase tracking-wider text-grayText">B2B</p>
              <p className="text-sm font-bold text-darkText">Marketplace</p>
            </div>
          </button>

          <form onSubmit={handleSearchSubmit} className="hidden flex-1 md:block">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-grayText">🔎</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search wholesale products, suppliers..."
                className="w-full rounded-xl border border-border bg-white pl-11 pr-28 py-3 text-sm text-darkText shadow-sm outline-none transition focus:border-[#4CAF50]"
              />
              <button type="submit" className="btn-primary absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-bold">
                Search
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <label className="hidden items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-grayText shadow-sm lg:flex">
              <span aria-hidden="true">📍</span>
              <select
                value={selectedLocation}
                onChange={(event) => setSelectedLocation(event.target.value)}
                className="bg-transparent text-sm text-darkText outline-none"
              >
                {locations.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-lg shadow-sm"
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
            </button>

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-lg shadow-sm"
              aria-label="Cart"
              title="Cart"
            >
              🛒
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm text-darkText shadow-sm"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
              >
                <span className="text-base" aria-hidden="true">👤</span>
                <span className="hidden sm:inline">Profile</span>
              </button>

              {profileOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-xl">
                  <div className="rounded-xl bg-lightGreen px-3 py-2">
                    <p className="truncate text-sm font-semibold text-darkText">{organizationName}</p>
                    <p className="text-xs capitalize text-grayText">{roleLabel}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="mt-2 block rounded-xl px-3 py-2 text-sm text-darkText hover:bg-lightGreen"
                  >
                    Manage profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-darkText hover:bg-lightGreen"
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto block w-full max-w-7xl px-4 pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grayText">🔎</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search wholesale products, suppliers..."
              className="h-12 w-full rounded-xl border border-border bg-white pl-10 pr-24 text-sm text-darkText shadow-sm outline-none focus:border-primary"
            />
            <button type="submit" className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-2 text-xs font-bold">
              Search
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 lg:px-6">{children}</main>

      <footer className="border-t border-border bg-lightGreen/40">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 text-sm text-grayText md:grid-cols-4 lg:px-6">
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-darkText">Company</h3>
            <ul className="space-y-2">
              <li>About Us</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-darkText">Resources</h3>
            <ul className="space-y-2">
              <li>Blog</li>
              <li>Wholesale Guides</li>
              <li>API Status</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-darkText">Policies</h3>
            <ul className="space-y-2">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Returns & Refunds</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-darkText">Support</h3>
            <ul className="space-y-2">
              <li>Help Center</li>
              <li>Contact Support</li>
              <li>Report Issue</li>
            </ul>
          </section>
        </div>
      </footer>

      <nav className="fixed bottom-3 left-1/2 z-50 flex w-[94%] -translate-x-1/2 items-center justify-between rounded-2xl border border-border bg-white px-4 py-2 shadow-xl md:hidden">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-[11px] font-medium text-grayText">
          <span className="text-lg">🏠</span>
          <span>Home</span>
        </Link>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-grayText"
        >
          <span className="text-lg">🔎</span>
          <span>Search</span>
        </button>
        <Link to="/orders" className="flex flex-col items-center gap-1 text-[11px] font-medium text-grayText">
          <span className="text-lg">📦</span>
          <span>Orders</span>
        </Link>
        <Link to="/inventory" className="flex flex-col items-center gap-1 text-[11px] font-medium text-grayText">
          <span className="text-lg">📥</span>
          <span>Inventory</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-[11px] font-medium text-grayText">
          <span className="text-lg">👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}
