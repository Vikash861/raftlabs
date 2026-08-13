import { randomUUID } from "node:crypto";
import { z } from "zod";
import { findMenuItem } from "./menu";
import type { CreateOrderInput, Order, OrderLine, OrderStatus } from "../shared/types";

export const orderStatuses: OrderStatus[] = [
  "Order Received",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().min(1).max(20)
      })
    )
    .min(1, "Add at least one item to the order."),
  delivery: z.object({
    name: z.string().trim().min(2, "Name is required."),
    address: z.string().trim().min(5, "Address is required."),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, "Phone number is invalid.")
  })
});

export const updateStatusSchema = z.object({
  status: z.enum(orderStatuses)
});

type StoreOptions = {
  autoAdvance?: boolean;
  statusDelayMs?: number;
};

export class OrderStore {
  private orders = new Map<string, Order>();
  private timers = new Map<string, NodeJS.Timeout[]>();
  private readonly autoAdvance: boolean;
  private readonly statusDelayMs: number;

  constructor(options: StoreOptions = {}) {
    this.autoAdvance = options.autoAdvance ?? false;
    this.statusDelayMs = options.statusDelayMs ?? 5000;
  }

  list() {
    return [...this.orders.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  find(id: string) {
    return this.orders.get(id);
  }

  create(input: CreateOrderInput) {
    const parsed = createOrderSchema.parse(input);
    const items = this.buildOrderLines(parsed.items);
    const now = new Date().toISOString();
    const order: Order = {
      id: randomUUID(),
      items,
      delivery: parsed.delivery,
      status: "Order Received",
      total: money(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(order.id, order);

    if (this.autoAdvance) {
      this.scheduleStatusUpdates(order.id);
    }

    return order;
  }

  updateStatus(id: string, status: OrderStatus) {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updated = {
      ...order,
      status,
      updatedAt: new Date().toISOString()
    };

    this.orders.set(id, updated);

    if (status === "Cancelled" || status === "Delivered") {
      this.clearTimers(id);
    }

    return updated;
  }

  delete(id: string) {
    const exists = this.orders.delete(id);
    this.clearTimers(id);
    return exists;
  }

  clear() {
    for (const id of this.orders.keys()) {
      this.clearTimers(id);
    }
    this.orders.clear();
  }

  private buildOrderLines(items: CreateOrderInput["items"]): OrderLine[] {
    return items.map((line) => {
      const menuItem = findMenuItem(line.menuItemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${line.menuItemId}`);
      }

      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: line.quantity
      };
    });
  }

  private scheduleStatusUpdates(id: string) {
    const updates: OrderStatus[] = ["Preparing", "Out for Delivery", "Delivered"];
    const timers = updates.map((status, index) =>
      setTimeout(() => {
        const order = this.orders.get(id);
        if (!order || order.status === "Cancelled") return;
        if (statusRank(status) <= statusRank(order.status)) return;
        this.updateStatus(id, status);
      }, this.statusDelayMs * (index + 1))
    );

    this.timers.set(id, timers);
  }

  private clearTimers(id: string) {
    const timers = this.timers.get(id) ?? [];
    timers.forEach(clearTimeout);
    this.timers.delete(id);
  }
}

function money(value: number) {
  return Math.round(value * 100) / 100;
}

function statusRank(status: OrderStatus) {
  return orderStatuses.indexOf(status);
}
