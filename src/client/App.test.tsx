import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { MenuItem, Order } from "../shared/types";

const menu: MenuItem[] = [
  {
    id: "classic-burger",
    name: "Classic Burger",
    description: "Beef patty and cheddar.",
    price: 10.75,
    image: "burger.jpg"
  }
];

const order: Order = {
  id: "order-12345678",
  items: [{ menuItemId: "classic-burger", name: "Classic Burger", price: 10.75, quantity: 2 }],
  delivery: {
    name: "Khush",
    address: "221B Baker Street",
    phone: "+1 555 123 4567"
  },
  status: "Order Received",
  total: 21.5,
  createdAt: "2026-08-12T10:00:00.000Z",
  updatedAt: "2026-08-12T10:00:00.000Z"
};

const activeOrderKey = "food-order-manager:active-order-id";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("lets a user add items and place an order", async () => {
    const webSocketClose = vi.fn();
    const webSocketAddEventListener = vi.fn();
    const webSocketMock = vi.fn(() => ({
      addEventListener: webSocketAddEventListener,
      close: webSocketClose
    }));

    const fetchMock = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      if (String(url) === "/api/menu") {
        return jsonResponse(menu);
      }

      if (String(url) === "/api/orders" && options?.method === "POST") {
        return jsonResponse(order, 201);
      }

      return jsonResponse({ message: "Not found" }, 404);
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("WebSocket", webSocketMock);

    render(<App />);

    expect(await screen.findByText("Classic Burger")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    await userEvent.click(screen.getByRole("button", { name: "Increase Classic Burger" }));

    expect(screen.getByLabelText("Classic Burger quantity")).toHaveValue(2);
    expect(screen.getByText("$21.50")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Name"), "Khush");
    await userEvent.type(screen.getByLabelText("Address"), "221B Baker Street");
    await userEvent.type(screen.getByLabelText("Phone"), "+1 555 123 4567");
    await userEvent.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            items: [{ menuItemId: "classic-burger", quantity: 2 }],
            delivery: {
              name: "Khush",
              address: "221B Baker Street",
              phone: "+1 555 123 4567"
            }
          })
        })
      );
    });

    expect(await screen.findByText("Order status")).toBeInTheDocument();
    expect(screen.getByText("Order #order-12")).toBeInTheDocument();
    expect(screen.getByText("Order Received")).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContain("/api/orders/order-12345678");
    expect(webSocketMock).toHaveBeenCalledWith("ws://localhost:3000/ws/orders/order-12345678");
    expect(window.localStorage.getItem(activeOrderKey)).toBe(order.id);
  });

  it("restores the latest customer order after refresh", async () => {
    let messageListener: ((event: MessageEvent) => void) | undefined;
    const webSocketMock = vi.fn(() => ({
      addEventListener: vi.fn((eventName: string, listener: (event: MessageEvent) => void) => {
        if (eventName === "message") {
          messageListener = listener;
        }
      }),
      close: vi.fn()
    }));
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url) === "/api/menu") {
        return jsonResponse(menu);
      }

      if (String(url) === "/api/orders/order-12345678") {
        return jsonResponse(order);
      }

      return jsonResponse({ message: "Not found" }, 404);
    });

    window.localStorage.setItem(activeOrderKey, order.id);
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("WebSocket", webSocketMock);

    render(<App />);

    expect(await screen.findByText("Order #order-12")).toBeInTheDocument();
    expect(webSocketMock).toHaveBeenCalledWith("ws://localhost:3000/ws/orders/order-12345678");

    act(() => {
      messageListener?.({
        data: JSON.stringify({ type: "order.updated", order: { ...order, status: "Preparing" } })
      } as MessageEvent);
    });

    await waitFor(() => {
      expect(document.querySelectorAll(".timeline li.active")).toHaveLength(2);
    });
  });
});

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  } as Response);
}
