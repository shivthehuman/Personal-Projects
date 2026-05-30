import { api } from "./http";

export type CreateProductInput = {
    name: string;
    description: string;
    moq: number;
    unit: string;
    pricePerUnit: number;
};

export type ProductDocument = {
    title: string;
    url: string;
};

export type ProductLocation = {
    type: "Point";
    coordinates: [number, number];
};

export type ProductResponse = CreateProductInput & {
    _id?: string;
    id?: string;
    stock?: number;
    sellerId: string | {
        _id?: string;
        id?: string;
        legalName: string;
        organizationType?: string;
        location?: { type: string; coordinates: [number, number] };
        phone?: string;
        email?: string;
        gstin?: string;
        businessType?: string;
        verificationStatus?: "Pending" | "Verified" | "Rejected";
        verificationDocuments?: { docType: string; url: string; status: string }[];
        trustScore?: number;
    };
    documents?: ProductDocument[];
    location?: ProductLocation;
    distance?: number;
    createdAt?: string;
    updatedAt?: string;
};

export async function createProduct(data: CreateProductInput): Promise<ProductResponse> {
    const response = await api.post<ProductResponse>("/products", data);
    return response.data;
}

export async function fetchProductById(productId: string): Promise<ProductResponse> {
    const response = await api.get<ProductResponse>(`/products/${productId}`);
    return response.data;
}

export async function getNearbyProducts(
    lng: number,
    lat: number,
    radiusInKm: number | undefined,
    q?: string,
    skip?: number,
    limit?: number,
    minPrice?: number | undefined,
    maxPrice?: number | undefined,
    category?: string | undefined
): Promise<ProductResponse[]> {
    const params: any = { lat, lng, minPrice, maxPrice, skip, limit, q, category };
    if (typeof radiusInKm === "number") params.radiusInKm = radiusInKm;
    // ensure undefined values are not dropped (axios will ignore undefined params)

    const response = await api.get<ProductResponse[]>("/products/nearby", { params });
    return response.data;
}

export async function listProducts(owner?: string, skip?: number, limit?: number): Promise<ProductResponse[]> {
    const params: any = {};
    if (owner) params.owner = owner;
    if (typeof skip === "number") params.skip = skip;
    if (typeof limit === "number") params.limit = limit;
    const response = await api.get<ProductResponse[]>("/products", { params });
    return response.data;
}

export async function updateProduct(id: string, data: Partial<CreateProductInput>): Promise<ProductResponse> {
    const response = await api.patch<ProductResponse>(`/products/${id}`, data);
    return response.data;
}

export async function deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
}
