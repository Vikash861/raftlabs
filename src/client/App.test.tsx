import { render, screen, waitFor } from "@testing-library/react";
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

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lets a user add items and place an order", async () => {
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
  });
});

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  } as Response);
}
