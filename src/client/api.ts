import type { CreateOrderInput, MenuItem, Order, OrderStatus } from "../shared/types";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";
const webSocketBaseUrl = import.meta.env.VITE_WS_URL;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body.errors?.join(" ") || body.message || "Request failed.";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getMenu() {
  return request<MenuItem[]>("/api/menu");
}

export function createOrder(order: CreateOrderInput) {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(order)
  });
}

export function getOrder(id: string) {
  return request<Order>(`/api/orders/${id}`);
}

export function getOrders() {
  return request<Order[]>("/api/orders");
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return request<Order>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function subscribeToOrder(id: string, onOrder: (order: Order) => void) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const baseUrl = webSocketBaseUrl ?? `${protocol}//${window.location.host}`;
  const socket = new WebSocket(`${baseUrl}/ws/orders/${id}`);

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data) as { type: string; order?: Order };
    if (message.type === "order.updated" && message.order) {
      onOrder(message.order);
    }
  });

  return () => socket.close();
}
