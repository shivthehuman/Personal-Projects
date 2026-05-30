import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormEvent, ReactElement } from "react";
import { useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import { registerRequest } from "../api/auth.api";
import { getHttpErrorMessage } from "../lib/errors";

const MOCK_INDORE_LNG_LAT: [number, number] = [75.8577, 22.7196];

const ROLE_OPTIONS = ["buyer", "seller", "transporter"] as const;
const ORG_TYPE_OPTIONS = ["buyer", "seller", "transporter", "other"] as const;

export function RegisterPage(): ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [legalName, setLegalName] = useState("");
  const [orgType, setOrgType] = useState<(typeof ORG_TYPE_OPTIONS)[number]>("buyer");
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email: trimmedEmail,
        password,
        role,
        organization: {
          legalName: legalName.trim(),
          type: orgType,
          location: {
            type: "Point",
            coordinates: MOCK_INDORE_LNG_LAT,
          },
        },
      };
      console.log("🔥 ATTEMPTING REGISTER POST to /auth/register:", payload);
      return registerRequest(payload);
    },
    onSuccess: async () => {
      setSubmitError(null);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/dashboard", { replace: true });
    },
    onError: (error: unknown) => {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? "That email is already registered."
          : getHttpErrorMessage(error, "Could not create your account.");
      setSubmitError(message);
    },
  });

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    setSubmitError(null);

    if (legalName.trim().length < 2) {
      setSubmitError("Please enter a legal organization name.");
      return;
    }

    if (password.length < 10) {
      setSubmitError("Password must be at least 10 characters.");
      return;
    }

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
              Create your organization once. Every user is tied to a verified business profile.
            </div>
          </div>
          <div className="max-w-md text-xs leading-relaxed text-neutral-300">
            Location is preset to Indore for this milestone (mock pin). Hyper-local discovery lands in Phase 2.
          </div>
        </aside>

        <div className="flex items-start justify-center px-6 py-12 md:items-center md:py-16">
          <div className="w-full max-w-xl">
            <div className="md:hidden mb-10 text-sm font-semibold tracking-wide">B2B</div>

            <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Register your organization and your primary user in one step.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-neutral-900" htmlFor="legalName">
                    Legal organization name
                  </label>
                  <input
                    id="legalName"
                    name="legalName"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                    placeholder="Example Traders Pvt Ltd"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-900" htmlFor="orgType">
                    Organization type
                  </label>
                  <select
                    id="orgType"
                    name="orgType"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as (typeof ORG_TYPE_OPTIONS)[number])}
                    disabled={isPending}
                  >
                    {ORG_TYPE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-900" htmlFor="role">
                    Your role
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                    value={role}
                    onChange={(e) => setRole(e.target.value as (typeof ROLE_OPTIONS)[number])}
                    disabled={isPending}
                  >
                    {ROLE_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-neutral-900" htmlFor="email">
                    Work email
                  </label>
                  <input
                    id="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                    placeholder="you@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-neutral-900" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                  />
                  <p className="text-xs text-neutral-600">
                    Minimum 10 characters (aligns with the API policy). Admin signup is intentionally disabled on the backend.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-sm font-semibold text-neutral-900">Mock HQ location</div>
                <p className="mt-1 text-sm text-neutral-600">
                  For now we pin organizations to{" "}
                  <span className="font-semibold text-neutral-900">Indore, Madhya Pradesh</span> (
                  lng/lat: <span className="font-mono text-xs">{MOCK_INDORE_LNG_LAT.join(", ")}</span>).
                </p>
              </div>

              {submitError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                  {submitError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isPending || trimmedEmail.length === 0 || password.length === 0 || legalName.trim().length < 2}
                className="inline-flex w-full items-center justify-center bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Creating account…" : "Continue"}
              </button>
            </form>

            <p className="mt-8 text-sm text-neutral-700">
              Already onboarded?{" "}
              <Link className="font-semibold text-neutral-950 underline-offset-4 hover:underline" to="/login">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
