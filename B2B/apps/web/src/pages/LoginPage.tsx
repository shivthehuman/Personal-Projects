import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { loginRequest } from "../api/auth.api";
import { getHttpErrorMessage } from "../lib/errors";

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const mutation = useMutation({
    mutationFn: async () =>
      loginRequest({
        email: trimmedEmail,
        password,
      }),
    onSuccess: async () => {
      setSubmitError(null);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/dashboard", { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && error.response?.status === 401
          ? "Invalid credentials."
          : getHttpErrorMessage(error, "Could not sign in.");
      setSubmitError(message);
    },
  });

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setSubmitError(null);
    mutation.mutate();
  }

  const isPending = mutation.isPending;

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <div className="grid min-h-screen md:grid-cols-2">
        <aside className="relative hidden md:flex md:flex-col md:justify-between bg-neutral-950 px-12 py-12 text-white">
          <div>
            <div className="text-sm font-semibold tracking-[0.2em]">B2B</div>
            <div className="mt-8 max-w-md text-lg font-medium leading-snug">
              Minimal wholesale onboarding. Built for high-trust, high-volume trade.
            </div>
          </div>
          <div className="max-w-md text-xs leading-relaxed text-neutral-300">
            Offline shell + install later (PWA). Transport, inventory, and payments come next phases.
          </div>
        </aside>

        <div className="flex items-start justify-center px-6 py-12 md:items-center md:py-16">
          <div className="w-full max-w-md">
            <div className="md:hidden mb-10 text-sm font-semibold tracking-wide">B2B</div>

            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-neutral-600">Use your wholesale account credentials.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900" htmlFor="email">
                  Work email
                </label>
                <input
                  id="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none ring-0 transition-colors focus:border-neutral-950"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-900" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none ring-0 transition-colors focus:border-neutral-950"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                />
              </div>

              {submitError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {submitError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending || trimmedEmail.length === 0 || password.length === 0}
                className="inline-flex w-full items-center justify-center bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Signing in…" : "Continue"}
              </button>
            </form>

            <p className="mt-8 text-sm text-neutral-700">
              New organization?{" "}
              <Link className="font-semibold text-neutral-950 underline-offset-4 hover:underline" to="/register">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
