import { api } from "./http";

export type OrderStatus = "Pending" | "Accepted" | "Packed" | "Delivered";

export type OrderResponse = {
    _id?: string;
    id?: string;
    quantity: number;
    totalAmount: number;
    status: OrderStatus;
    createdAt?: string;
    productId:
    | string
    | {
        _id?: string;
        id?: string;
        name?: string;
        documents?: { title: string; url: string }[];
    };
    sellerId:
    | string
    | {
        _id?: string;
        id?: string;
        legalName?: string;
    };
    buyerId?:
    | string
    | {
        _id?: string;
        id?: string;
        email?: string;
        role?: string;
    };
};

export async function placeOrder(payload: { productId: string; quantity: number }): Promise<OrderResponse> {
    const response = await api.post<OrderResponse>("/orders", payload);
    return response.data;
}

export async function listOrders(view: "buyer" | "seller" = "buyer"): Promise<OrderResponse[]> {
    const response = await api.get<OrderResponse[]>("/orders", { params: { view } });
    return response.data;
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderResponse> {
    const response = await api.patch<OrderResponse>(`/orders/${orderId}/status`, { status });
    return response.data;
}
