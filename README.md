# Food Order Manager

A small TypeScript full-stack assignment for a food delivery order flow. It has a Vite React frontend, an Express REST API, in-memory menu and order storage, validation, tests, and simulated order status updates.

## Features

- Menu display with item images, descriptions, and prices
- Cart with quantity controls
- Checkout form for name, address, and phone
- Order creation, listing, lookup, status update, and delete endpoints
- Simulated order progress from `Order Received` to `Delivered`
- API and UI tests with Vitest

## Run Locally

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npm run dev
```

Start the frontend in a second terminal:

```bash
npm run dev:client
```

The app runs at `http://127.0.0.1:5173` and proxies API calls to `http://127.0.0.1:4000`.

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
