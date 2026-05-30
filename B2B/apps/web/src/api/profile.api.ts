import { api } from "./http";

export type MeResponse = {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    isProfileComplete?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  organization: {
    id: string;
    legalName: string;
    organizationType: string;
    phone?: string;
    businessType?: string;
    verificationStatus?: "Pending" | "Verified" | "Rejected";
    location: { type: "Point"; coordinates: [number, number] };
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};

export async function fetchMe(): Promise<MeResponse> {
  const resp = await api.get<MeResponse>("/users/me");
  return resp.data;
}

export async function updateBusinessInfo(payload: { legalName: string; phone: string; businessType: string }): Promise<void> {
  await api.patch("/users/me", {
    organization: {
      legalName: payload.legalName,
      phone: payload.phone,
      businessType: payload.businessType,
    },
  });
}
