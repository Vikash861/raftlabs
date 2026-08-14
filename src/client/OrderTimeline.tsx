import type { Order, OrderStatus } from "../shared/types";

const statuses: OrderStatus[] = [
  "Order Received",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export function OrderTimeline({ order }: { order: Order }) {
  const activeIndex = Math.max(0, statuses.indexOf(order.status));

  return (
    <ol className="timeline">
      {statuses.map((status, index) => (
        <li className={index <= activeIndex ? "active" : ""} key={status}>
          <span />
          {status}
        </li>
      ))}
    </ol>
  );
}
