import { FormEvent, useEffect, useMemo, useState } from "react";
import { createOrder, getMenu, getOrder } from "./api";
import type { CartItem, DeliveryDetails, MenuItem, Order, OrderStatus } from "../shared/types";
import "./styles.css";

const statuses: OrderStatus[] = ["Order Received", "Preparing", "Out for Delivery", "Delivered"];

const emptyDelivery: DeliveryDetails = {
  name: "",
  address: "",
  phone: ""
};

export default function App() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [delivery, setDelivery] = useState(emptyDelivery);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMenu()
      .then(setMenu)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingMenu(false));
  }, []);

  useEffect(() => {
    if (!order || order.status === "Delivered" || order.status === "Cancelled") return;

    const timer = window.setInterval(() => {
      getOrder(order.id)
        .then(setOrder)
        .catch((err) => setError(err.message));
    }, 2000);

    return () => window.clearInterval(timer);
  }, [order]);

  const subtotal = useMemo(
    () => cart.reduce((sum, cartItem) => sum + cartItem.item.price * cartItem.quantity, 0),
    [cart]
  );

  function addToCart(item: MenuItem) {
    setCart((current) => {
      const existing = current.find((cartItem) => cartItem.item.id === item.id);
      if (!existing) return [...current, { item, quantity: 1 }];

      return current.map((cartItem) =>
        cartItem.item.id === item.id
          ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, 20) }
          : cartItem
      );
    });
  }

  function changeQuantity(itemId: string, quantity: number) {
    if (quantity < 1) {
      setCart((current) => current.filter((cartItem) => cartItem.item.id !== itemId));
      return;
    }

    setCart((current) =>
      current.map((cartItem) =>
        cartItem.item.id === itemId ? { ...cartItem, quantity: Math.min(quantity, 20) } : cartItem
      )
    );
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPlacingOrder(true);

    try {
      const nextOrder = await createOrder({
        items: cart.map((cartItem) => ({
          menuItemId: cartItem.item.id,
          quantity: cartItem.quantity
        })),
        delivery
      });

      setOrder(nextOrder);
      setCart([]);
      setDelivery(emptyDelivery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="top-bar">
        <div>
          <p className="eyebrow">Order Management</p>
          <h1>Fresh food, tracked from cart to door.</h1>
        </div>
        <div className="summary-pill">
          <span>{cart.length}</span>
          <small>cart items</small>
        </div>
      </section>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div className="workspace">
        <section className="menu-section" aria-labelledby="menu-heading">
          <div className="section-heading">
            <h2 id="menu-heading">Menu</h2>
            <p>Pick a few favorites and adjust the cart before checkout.</p>
          </div>

          {loadingMenu ? (
            <p className="muted">Loading menu...</p>
          ) : (
            <div className="menu-grid">
              {menu.map((item) => (
                <article className="menu-card" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <div className="menu-copy">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="menu-actions">
                      <strong>${item.price.toFixed(2)}</strong>
                      <button type="button" onClick={() => addToCart(item)}>
                        Add
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="checkout-panel" aria-label="Cart and checkout">
          <section>
            <div className="section-heading compact">
              <h2>Cart</h2>
              <p>{cart.length === 0 ? "Your cart is empty." : "Review quantities."}</p>
            </div>

            <div className="cart-list">
              {cart.map((cartItem) => (
                <div className="cart-row" key={cartItem.item.id}>
                  <div>
                    <strong>{cartItem.item.name}</strong>
                    <span>${cartItem.item.price.toFixed(2)}</span>
                  </div>
                  <div className="quantity-control">
                    <button
                      type="button"
                      aria-label={`Decrease ${cartItem.item.name}`}
                      onClick={() => changeQuantity(cartItem.item.id, cartItem.quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      aria-label={`${cartItem.item.name} quantity`}
                      min="1"
                      max="20"
                      type="number"
                      value={cartItem.quantity}
                      onChange={(event) => changeQuantity(cartItem.item.id, Number(event.target.value))}
                    />
                    <button
                      type="button"
                      aria-label={`Increase ${cartItem.item.name}`}
                      onClick={() => changeQuantity(cartItem.item.id, cartItem.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="total-line">
              <span>Total</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
          </section>

          <form className="checkout-form" onSubmit={placeOrder}>
            <div className="section-heading compact">
              <h2>Delivery</h2>
              <p>Where should the order go?</p>
            </div>

            <label>
              Name
              <input
                required
                value={delivery.name}
                onChange={(event) => setDelivery({ ...delivery, name: event.target.value })}
              />
            </label>

            <label>
              Address
              <textarea
                required
                rows={3}
                value={delivery.address}
                onChange={(event) => setDelivery({ ...delivery, address: event.target.value })}
              />
            </label>

            <label>
              Phone
              <input
                required
                value={delivery.phone}
                onChange={(event) => setDelivery({ ...delivery, phone: event.target.value })}
              />
            </label>

            <button className="primary-button" disabled={cart.length === 0 || placingOrder} type="submit">
              {placingOrder ? "Placing..." : "Place order"}
            </button>
          </form>

          {order && <OrderStatusCard order={order} />}
        </aside>
      </div>
    </main>
  );
}

function OrderStatusCard({ order }: { order: Order }) {
  const activeIndex = Math.max(0, statuses.indexOf(order.status));

  return (
    <section className="status-card" aria-label="Order status">
      <div className="section-heading compact">
        <h2>Order status</h2>
        <p>Order #{order.id.slice(0, 8)}</p>
      </div>

      <ol className="timeline">
        {statuses.map((status, index) => (
          <li className={index <= activeIndex ? "active" : ""} key={status}>
            <span />
            {status}
          </li>
        ))}
      </ol>
    </section>
  );
}
