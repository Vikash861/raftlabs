import { useEffect, useMemo, useState } from "react";
import { getOrder, subscribeToOrder } from "./api";
import { getSavedOrderIds, removeSavedOrderId } from "./orderStorage";
import { OrderTimeline } from "./OrderTimeline";
import type { Order } from "../shared/types";

export function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const orderIds = useMemo(() => orders.map((order) => order.id).join("|"), [orders]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (orders.length === 0) return;

    const unsubscribe = orders.map((order) =>
      subscribeToOrder(order.id, (updatedOrder) => {
        setOrders((current) =>
          current.map((currentOrder) =>
            currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder
          )
        );
      })
    );

    return () => unsubscribe.forEach((stop) => stop());
  }, [orderIds]);

  async function loadOrders() {
    const savedIds = getSavedOrderIds();

    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const results = await Promise.allSettled(savedIds.map((id) => getOrder(id)));
      const foundOrders: Order[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          foundOrders.push(result.value);
        } else {
          removeSavedOrderId(savedIds[index]);
        }
      });

      setOrders(foundOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your orders.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Customer Orders</p>
          <h1>Track your recent orders.</h1>
        </div>
        <nav className="page-links" aria-label="Customer navigation">
          <a className="text-link" href="/">
            Menu
          </a>
          <a className="text-link" href="/admin">
            Admin
          </a>
        </nav>
      </section>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading your orders...</p>
      ) : orders.length === 0 ? (
        <section className="empty-state">
          <h2>No orders found</h2>
          <p>Orders placed from this browser will appear here automatically.</p>
        </section>
      ) : (
        <section className="user-orders" aria-label="Your orders">
          {orders.map((order) => (
            <article className="user-order-card" key={order.id}>
              <div className="user-order-head">
                <div>
                  <strong>Order #{order.id.slice(0, 8)}</strong>
                  <small>{new Date(order.createdAt).toLocaleString()}</small>
                </div>
                <span>{order.status}</span>
              </div>

              <div className="user-order-items">
                {order.items.map((item) => (
                  <div key={item.menuItemId}>
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className="total-line">
                <span>Total</span>
                <strong>${order.total.toFixed(2)}</strong>
              </div>

              <OrderTimeline order={order} />
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
