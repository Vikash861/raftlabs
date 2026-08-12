import { useEffect, useState } from "react";
import { getOrders, updateOrderStatus } from "./api";
import type { Order, OrderStatus } from "../shared/types";

const statuses: OrderStatus[] = [
  "Order Received",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();

    const timer = window.setInterval(loadOrders, 3000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadOrders() {
    try {
      const nextOrders = await getOrders();
      setOrders(nextOrders);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(orderId: string, status: OrderStatus) {
    try {
      const updatedOrder = await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update order.");
    }
  }

  return (
    <main className="page-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Manage live orders.</h1>
        </div>
        <a className="text-link" href="/">
          Customer view
        </a>
      </section>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading orders...</p>
      ) : orders.length === 0 ? (
        <section className="empty-state">
          <h2>No orders yet</h2>
          <p>Place an order from the customer view, then come back here to update it.</p>
        </section>
      ) : (
        <section className="orders-table" aria-label="Orders">
          <div className="orders-header">
            <span>Order</span>
            <span>Customer</span>
            <span>Total</span>
            <span>Status</span>
          </div>

          {orders.map((order) => (
            <article className="order-row" key={order.id}>
              <div>
                <strong>#{order.id.slice(0, 8)}</strong>
                <small>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</small>
              </div>
              <div>
                <strong>{order.delivery.name}</strong>
                <small>{order.delivery.phone}</small>
              </div>
              <strong>${order.total.toFixed(2)}</strong>
              <select
                aria-label={`Status for order ${order.id.slice(0, 8)}`}
                value={order.status}
                onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
