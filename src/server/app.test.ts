import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { menuItems } from "./menu";
import { OrderStore } from "./orderStore";

describe("order API", () => {
  const store = new OrderStore({ autoAdvance: false });
  const app = createApp({ store });

  beforeEach(() => {
    store.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the menu", async () => {
    const response = await request(app).get("/api/menu").expect(200);

    expect(response.body).toHaveLength(menuItems.length);
    expect(response.body[0]).toMatchObject({
      id: "margherita-pizza",
      name: "Margherita Pizza"
    });
  });

  it("validates order input", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        items: [],
        delivery: {
          name: "K",
          address: "",
          phone: "abc"
        }
      })
      .expect(400);

    expect(response.body.message).toBe("Validation failed.");
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it("creates, reads, updates, lists, and deletes an order", async () => {
    const createResponse = await request(app)
      .post("/api/orders")
      .send({
        items: [
          { menuItemId: "classic-burger", quantity: 2 },
          { menuItemId: "spicy-noodles", quantity: 1 }
        ],
        delivery: {
          name: "Khush",
          address: "221B Baker Street",
          phone: "+1 555 123 4567"
        }
      })
      .expect(201);

    expect(createResponse.body.status).toBe("Order Received");
    expect(createResponse.body.total).toBe(31.4);

    const id = createResponse.body.id;

    const readResponse = await request(app).get(`/api/orders/${id}`).expect(200);
    expect(readResponse.body.delivery.name).toBe("Khush");

    const updateResponse = await request(app)
      .patch(`/api/orders/${id}/status`)
      .send({ status: "Preparing" })
      .expect(200);
    expect(updateResponse.body.status).toBe("Preparing");

    const listResponse = await request(app).get("/api/orders").expect(200);
    expect(listResponse.body).toHaveLength(1);

    await request(app).delete(`/api/orders/${id}`).expect(204);
    await request(app).get(`/api/orders/${id}`).expect(404);
  });

  it("rejects orders with unknown menu items", async () => {
    const response = await request(app)
      .post("/api/orders")
      .send({
        items: [{ menuItemId: "missing", quantity: 1 }],
        delivery: {
          name: "Khush",
          address: "221B Baker Street",
          phone: "+1 555 123 4567"
        }
      })
      .expect(400);

    expect(response.body.message).toContain("Menu item not found");
  });

  it("does not let scheduled updates overwrite newer admin status changes", async () => {
    vi.useFakeTimers();
    const liveStore = new OrderStore({ autoAdvance: true, statusDelayMs: 1000 });

    const order = liveStore.create({
      items: [{ menuItemId: "classic-burger", quantity: 1 }],
      delivery: {
        name: "Khush",
        address: "221B Baker Street",
        phone: "+1 555 123 4567"
      }
    });

    liveStore.updateStatus(order.id, "Out for Delivery");
    vi.advanceTimersByTime(1000);

    expect(liveStore.find(order.id)?.status).toBe("Out for Delivery");

    liveStore.clear();
  });
});
