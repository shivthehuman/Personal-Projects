import { api } from "./http";

export async function requestOtp(phone: string): Promise<void> {
    await api.post("/auth/otp/request", { phone });
}

export async function verifyOtp(phone: string, code: string): Promise<any> {
    const resp = await api.post("/auth/otp/verify", { phone, code });
    return resp.data;
}

export async function verifyGstin(orgId: string, gstin: string): Promise<{ verified: boolean }> {
    const resp = await api.post("/organizations/verify-gst", { orgId, gstin });
    return resp.data;
}

export async function updateOrganizationLocation(coordinates: [number, number]): Promise<any> {
    const resp = await api.patch("/organizations/location", { coordinates });
    return resp.data;
}

export async function completeOnboarding(): Promise<any> {
    const resp = await api.patch("/users/me", { isProfileComplete: true, onboardingStep: "completed" });
    return resp.data;
}

export async function uploadKycFile(file: File): Promise<any> {
    const fd = new FormData();
    fd.append("document", file, file.name);

    const resp = await api.post("/organizations/kyc-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });

    return resp.data;
}

export async function setRole(role: string): Promise<any> {
    const resp = await api.patch("/users/me", { role });
    return resp.data;
}

export async function saveShopName(legalName: string): Promise<any> {
    const resp = await api.patch("/users/me", { organization: { legalName } });
    return resp.data;
}
