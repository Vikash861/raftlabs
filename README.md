# Food Order Manager

A small TypeScript full-stack assignment for a food delivery order flow. It has a Vite React frontend, an Express REST API, in-memory menu and order storage, validation, tests, and WebSocket-based order status updates.

## Features

- Menu display with item images, descriptions, and prices
- Cart with quantity controls
- Checkout form for name, address, and phone
- Customer order history page at `/orders`
- Admin order management page at `/admin`
- Order creation, listing, lookup, status update, and delete endpoints
- Live order status updates through WebSocket subscriptions
- API and UI tests with Vitest

## Run Locally

Install dependencies:

```bash
npm install
```

Optional: create a `.env` file if your frontend is not using the Vite proxy:

```bash
VITE_API_URL=http://127.0.0.1:4000
VITE_WS_URL=ws://127.0.0.1:4000
```

Start the API:

```bash
npm run dev
```

Start the frontend in a second terminal:

```bash
npm run dev:client
```

The customer app runs at `http://127.0.0.1:5173`.

Useful pages:

- Customer menu: `http://127.0.0.1:5173`
- Customer orders: `http://127.0.0.1:5173/orders`
- Admin orders: `http://127.0.0.1:5173/admin`

Vite proxies API calls and WebSocket upgrades to the backend at `http://127.0.0.1:4000`.

## Deployment

The easiest deployment is to host the backend and frontend separately:

1. Deploy the backend API on Render, Railway, or another Node host.
2. Deploy the Vite frontend on Vercel or Netlify.
3. Add frontend environment variables that point to the hosted backend.

Backend service settings:

```bash
Build Command: npm install
Start Command: npm start
```

The backend reads the port from `PORT`, which Render/Railway set automatically.

Frontend service settings:

```bash
Build Command: npm run build
Publish Directory: dist
```

For Vercel, the included `vercel.json` rewrites `/orders` and `/admin` back to `index.html`.
For Netlify, the included `public/_redirects` file does the same after Vite copies it to `dist`.

Frontend environment variables:

```bash
VITE_API_URL=https://your-backend-url.onrender.com
VITE_WS_URL=wss://your-backend-url.onrender.com
```

Use `https` for API calls and `wss` for WebSocket calls in production.

## Real-Time Updates

When a customer places an order, the order ID is saved in browser `localStorage`. The customer order page reads those saved IDs, loads the matching orders with `GET /api/orders/:id`, and opens a WebSocket connection to:

```text
/ws/orders/:id
```

When the admin updates an order with `PATCH /api/orders/:id/status`, the backend broadcasts an `order.updated` message to connected clients for that order. The customer UI receives the message and updates the status timeline without refreshing the page.

## Tests

```bash
npm test
```

## API

- `GET /api/menu`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `DELETE /api/orders/:id`

## WebSocket

- `WS /ws/orders/:id`
