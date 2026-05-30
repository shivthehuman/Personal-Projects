import type { ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { requestOtp, verifyOtp, verifyGstin, updateOrganizationLocation, completeOnboarding, setRole as setRoleApi, saveShopName } from "../api/onboarding";
import { fetchMe } from "../api/profile.api";
import { setAccessToken } from "../lib/token-store";

export function OnboardingPage(): ReactElement {
  const [step, setStep] = useState(1);
  const total = 5;
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Step 1: OTP
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Step 2: Role selection
  const [role, setSelectedRole] = useState<"buyer" | "seller" | "transporter" | null>(null);

  // Step 3: business info
  const [shopName, setShopName] = useState("");
  const [gstin, setGstin] = useState("");
  const [gstLoading, setGstLoading] = useState(false);

  // location saving
  const [savingLocation, setSavingLocation] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [kycMessage, setKycMessage] = useState<string | null>(null);

  async function handleSendOtp(): Promise<void> {
    setSendingOtp(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch (err) {
      // TODO: show error toast
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp(): Promise<void> {
    setVerifyingOtp(true);
    try {
      const resp = await verifyOtp(phone, otp);
      if (resp?.accessToken) setAccessToken(resp.accessToken);
      await qc.invalidateQueries(["me"]);
      setStep(2);
    } catch (err) {
      // TODO: show error
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleVerifyGstin(orgId?: string): Promise<void> {
    if (!orgId) return;
    setGstLoading(true);
    try {
      const { verified } = await verifyGstin(orgId, gstin);
      if (verified) {
        await qc.invalidateQueries(["me"]);
      }
    } catch (err) {
      // ignore for now
    } finally {
      setGstLoading(false);
    }
  }

  async function handleSaveLocation(orgId?: string): Promise<void> {
    if (!orgId) return;
    setSavingLocation(true);
    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
            await updateOrganizationLocation(coords);
            await qc.invalidateQueries(["me"]);
            resolve();
          },
          (err) => reject(err),
          { enableHighAccuracy: true }
        );
      });
    } catch (err) {
      // TODO: error
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleComplete(): Promise<void> {
    try {
      await completeOnboarding();
      await qc.invalidateQueries(["me"]);
      navigate("/dashboard");
    } catch (err) {
      // TODO: show error
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div>
        <div className="w-full bg-border rounded-full h-2">
          <div className="bg-[#4CAF50] h-2 rounded-full" style={{ width: `${(step / total) * 100}%` }} />
        </div>
        <div className="mt-2 text-sm text-gray-600">Step {step} of {total}</div>
      </div>

      <div className="card-rounded p-6">
        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-text">Enter Mobile Number</h2>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" pattern="[0-9]*" className="w-full rounded-2xl border border-border px-4 py-4 text-lg" placeholder="Mobile number" />
            {!otpSent ? (
              <button disabled={sendingOtp || !phone} onClick={handleSendOtp} className="w-full mt-4 bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3">
                {sendingOtp ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <div className="space-y-2">
                <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" pattern="[0-9]*" className="w-full rounded-2xl border border-border px-4 py-4 text-lg" placeholder="Enter OTP" />
                <button disabled={verifyingOtp || !otp} onClick={handleVerifyOtp} className="w-full mt-4 bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3">
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-text">Choose Role</h2>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={async () => {
                try {
                  await setRoleApi("buyer");
                  setSelectedRole("buyer");
                  setStep(3);
                } catch {}
              }} className="p-4 rounded-2xl border border-border text-sm">Buyer</button>
              <button onClick={async () => {
                try {
                  await setRoleApi("seller");
                  setSelectedRole("seller");
                  setStep(3);
                } catch {}
              }} className="p-4 rounded-2xl border border-border text-sm">Seller</button>
              <button onClick={async () => {
                try {
                  await setRoleApi("transporter");
                  setSelectedRole("transporter");
                  setStep(3);
                } catch {}
              }} className="p-4 rounded-2xl border border-border text-sm">Transporter</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-text">Shop Name & Location</h2>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full rounded-2xl border border-border px-4 py-3" placeholder="Shop / Business name" />
            <div className="flex gap-2">
              <button disabled={savingLocation} onClick={() => void handleSaveLocation(undefined)} className="flex-1 bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3">
                {savingLocation ? "Saving location..." : "Use current location"}
              </button>
              <button onClick={async () => {
                if (shopName.trim()) {
                  try { await saveShopName(shopName.trim()); } catch (err) {}
                }
                setStep(4);
              }} className="flex-1 rounded-xl border border-border py-3">Skip</button>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700">GSTIN (optional)</label>
              <div className="mt-1 flex gap-2">
                <input value={gstin} onChange={(e) => setGstin(e.target.value)} className="flex-1 rounded-2xl border border-border px-4 py-3" placeholder="GSTIN" />
                <button disabled={gstLoading} onClick={async () => { const me = await fetchMe(); await handleVerifyGstin(me.organization.id); }} className="rounded-xl bg-[#4CAF50] text-white hover:bg-green-600 font-medium px-4 py-3">{gstLoading ? "Verifying..." : "Verify"}</button>
              </div>
            </div>
            <div className="mt-2">
              <button onClick={async () => { if (shopName.trim()) { try { await saveShopName(shopName.trim()); } catch (err) {} } setStep(4); }} className="mt-3 w-full bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3">Save & Continue</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-text">Dashboard Access</h2>
            <p className="text-sm text-gray-600">Your account is ready — continue to set up documents.</p>
            <div className="flex gap-2">
              <button onClick={() => setStep(5)} className="flex-1 bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3">Continue</button>
              <button onClick={handleComplete} className="flex-1 rounded-xl border border-border py-3">Finish & Go to Dashboard</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-text">Verification</h2>
            <p className="text-sm text-gray-600">Upload your Business License (PDF, JPG, PNG)</p>

            <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setKycFile(e.target.files?.[0] ?? null)} className="w-full" />

            {kycMessage ? (<div className="text-sm text-green-700">{kycMessage}</div>) : null}

            <div className="flex gap-2">
              <button disabled={!kycFile || uploadingKyc} onClick={async () => {
                if (!kycFile) return; setUploadingKyc(true); setKycMessage(null);
                try { await import("../api/onboarding").then(async (m) => { await m.uploadKycFile(kycFile); setKycMessage("Upload successful."); await qc.invalidateQueries(["me"]); }); }
                catch (err) { setKycMessage("Upload failed. Ensure PDF/JPG/PNG and try again."); }
                finally { setUploadingKyc(false); }
              }} className="flex-1 bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-3">{uploadingKyc ? "Uploading..." : "Upload Document"}</button>

              <button onClick={handleComplete} className="flex-1 rounded-xl border border-border py-3">Skip & Finish</button>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          {step > 1 && (<button className="flex-1 rounded-xl border border-border py-2" onClick={() => setStep((s) => s - 1)}>Back</button>)}
          {step < total && (<button className="flex-1 bg-[#4CAF50] text-white hover:bg-green-600 rounded-xl font-medium py-2" onClick={() => setStep((s) => s + 1)}>Next</button>)}
        </div>
      </div>
    </div>
  );
}
