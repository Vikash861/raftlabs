import { createApp } from "./app";
import { OrderStore } from "./orderStore";
import { attachOrderWebSocketServer } from "./orderWebSocket";

const port = Number(process.env.PORT ?? 4000);
const store = new OrderStore();
let broadcastOrder: ReturnType<typeof attachOrderWebSocketServer>["broadcastOrder"] = () => {};
const app = createApp({
  store,
  onOrderUpdated: (order) => broadcastOrder(order)
});

const server = app.listen(port, () => {
  console.log(`API running on http://127.0.0.1:${port}`);
});

broadcastOrder = attachOrderWebSocketServer(server, store).broadcastOrder;
