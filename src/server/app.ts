import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { menuItems } from "./menu";
import { OrderStore, updateStatusSchema } from "./orderStore";
import type { Order } from "../shared/types";

type AppOptions = {
  store?: OrderStore;
  onOrderUpdated?: (order: Order) => void;
};

export function createApp(options: AppOptions = {}) {
  const app = express();
  const store = options.store ?? new OrderStore();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/menu", (_req, res) => {
    res.json(menuItems);
  });

  app.get("/api/orders", (_req, res) => {
    res.json(store.list());
  });

  app.post("/api/orders", (req, res) => {
    try {
      const order = store.create(req.body);
      res.status(201).json(order);
    } catch (error) {
      handleRequestError(error, res);
    }
  });

  app.get("/api/orders/:id", (req, res) => {
    const order = store.find(req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.json(order);
  });

  app.patch("/api/orders/:id/status", (req, res) => {
    try {
      const { status } = updateStatusSchema.parse(req.body);
      const order = store.updateStatus(req.params.id, status);

      if (!order) {
        res.status(404).json({ message: "Order not found." });
        return;
      }

      options.onOrderUpdated?.(order);
      res.json(order);
    } catch (error) {
      handleRequestError(error, res);
    }
  });

  app.delete("/api/orders/:id", (req, res) => {
    const deleted = store.delete(req.params.id);
    if (!deleted) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    res.status(204).send();
  });

  return app;
}

function handleRequestError(error: unknown, res: express.Response) {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed.",
      errors: error.issues.map((issue) => issue.message)
    });
    return;
  }

  if (error instanceof Error && error.message.startsWith("Menu item not found")) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Something went wrong." });
}
