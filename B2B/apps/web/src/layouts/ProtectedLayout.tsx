import type { ReactElement } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";

import { useAccessToken } from "../lib/token-store";
import { useAuthReady } from "../providers/AppProviders";
import { Layout } from "../components/Layout";

export function ProtectedLayout(): ReactElement {
  const navigate = useNavigate();
  const ready = useAuthReady();
  const token = useAccessToken();

  if (!ready) {
    return (
      <div className="min-h-screen bg-white text-gray-950">
        <div className="mx-auto flex max-w-5xl flex-col px-6 py-10">
          <div className="h-10 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mt-8 h-52 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
