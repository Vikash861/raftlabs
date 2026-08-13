import type { IncomingMessage } from "node:http";
import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import type { Order } from "../shared/types";
import type { OrderStore } from "./orderStore";

export function attachOrderWebSocketServer(server: Server, store: OrderStore) {
  const webSocketServer = new WebSocketServer({ noServer: true });
  const clients = new Map<string, Set<WebSocket>>();

  server.on("upgrade", (request, socket, head) => {
    const orderId = getOrderId(request);
    if (!orderId) {
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit("connection", webSocket, request, orderId);
    });
  });

  webSocketServer.on("connection", (webSocket: WebSocket, _request: IncomingMessage, orderId: string) => {
    const order = store.find(orderId);
    if (!order) {
      webSocket.close(1008, "Order not found");
      return;
    }

    addClient(orderId, webSocket);
    sendOrder(webSocket, order);

    webSocket.on("close", () => removeClient(orderId, webSocket));
  });

  return {
    broadcastOrder(order: Order) {
      const orderClients = clients.get(order.id) ?? new Set<WebSocket>();

      orderClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          sendOrder(client, order);
        }
      });
    }
  };

  function addClient(orderId: string, webSocket: WebSocket) {
    const orderClients = clients.get(orderId) ?? new Set<WebSocket>();
    orderClients.add(webSocket);
    clients.set(orderId, orderClients);
  }

  function removeClient(orderId: string, webSocket: WebSocket) {
    const orderClients = clients.get(orderId);
    if (!orderClients) return;

    orderClients.delete(webSocket);
    if (orderClients.size === 0) {
      clients.delete(orderId);
    }
  }
}

function getOrderId(request: IncomingMessage) {
  const requestUrl = new URL(request.url ?? "", "http://localhost");
  const match = requestUrl.pathname.match(/^\/ws\/orders\/([^/]+)$/);
  return match?.[1];
}

function sendOrder(webSocket: WebSocket, order: Order) {
  webSocket.send(JSON.stringify({ type: "order.updated", order }));
}
