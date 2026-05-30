import type { FormEvent, ReactElement } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { fetchMe, updateBusinessInfo } from "../api/profile.api";
import { getHttpErrorMessage } from "../lib/errors";

export function ProfilePage(): ReactElement {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  const [isEditing, setIsEditing] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState("");

  useEffect(() => {
    if (!meQuery.data) return;
    setLegalName(meQuery.data.organization.legalName ?? "");
    setPhone(meQuery.data.organization.phone ?? "");
    setBusinessType(meQuery.data.organization.businessType ?? "");
  }, [meQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateBusinessInfo,
    onSuccess: async () => {
      setIsEditing(false);
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
  });


  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    updateMutation.mutate({ legalName, phone, businessType });
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div />
      </div>

      {meQuery.isLoading ? <div className="text-sm text-gray-600">Loading profile...</div> : null}
      {meQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {getHttpErrorMessage(meQuery.error, "Could not load profile.")}
        </div>
      ) : null}

      {meQuery.data ? (
        <>
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-900">User</h2>
            <dl className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Email</dt>
                <dd className="text-sm font-semibold text-gray-900">{meQuery.data.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Role</dt>
                <dd className="text-sm font-semibold text-gray-900 capitalize">{meQuery.data.user.role}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Organization</h2>
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className="bg-[#4CAF50] text-white rounded-xl px-3 py-1.5 text-xs font-semibold hover:bg-green-600"
              >
                {isEditing ? "Cancel" : "Edit Business Info"}
              </button>
            </div>

            {!isEditing ? (
              <dl className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Legal Name</dt>
                  <dd className="text-sm font-semibold text-gray-900">{meQuery.data.organization.legalName || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Phone</dt>
                  <dd className="text-sm font-semibold text-gray-900">{meQuery.data.organization.phone || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Business Type</dt>
                  <dd className="text-sm font-semibold text-gray-900">{meQuery.data.organization.businessType || "-"}</dd>
                </div>
              </dl>
            ) : (
              <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
                <label className="text-sm text-gray-700">
                  Legal Name
                  <input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Phone
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  Business Type
                  <input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </label>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="bg-[#4CAF50] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-green-600 disabled:opacity-60"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {updateMutation.isError ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {getHttpErrorMessage(updateMutation.error, "Could not update business info.")}
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
