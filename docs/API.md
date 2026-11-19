# Zanora API and Mobile Integration Guide

## Overview

Zanora exposes a tRPC API under `/api/trpc`. The server is implemented in `server/routers.ts` and uses `superjson` as the tRPC transformer. The current web application uses cookie-based Manus OAuth sessions.

Base URLs:

```text
Local:   http://localhost:3000
Preview: https://3000-iq0q1xkaxu3y0uwesdsx3-e3aa4ebb.us3.manus.computer
API:     {BASE_URL}/api/trpc
```

The preview URL is for development/demo use. Use a stable HTTPS production origin for a released mobile application.

## Authentication model

Authentication is resolved on every request by `createContext()` through `sdk.authenticateRequest(req)`. The authenticated user is stored in the request context and procedures apply one of three access levels:

| Procedure | Access | Current use |
|---|---|---|
| `publicProcedure` | No login | Health, auth state, public product reviews |
| `protectedProcedure` | Signed-in user | Checkout, own orders, creating a review |
| `adminProcedure` | Signed-in user with `role = admin` | Inventory, discounts, reports, admin dashboard |

The web login flow is:

1. The browser calls the client `startLogin()` helper.
2. The helper creates a one-time `__Host-oauth_state` nonce cookie.
3. The browser is redirected to Manus OAuth.
4. Manus redirects to `/api/oauth/callback?code=...&state=...`.
5. The server verifies the state nonce, exchanges the code, upserts the user, creates a one-year session token, and sets the `webdev_app_session` cookie.
6. The browser is redirected to `/`.

The session cookie is configured for HTTPS cross-site Preview embedding with `SameSite=None; Secure`. The current OAuth callback always redirects to the web root, so it is not yet a native deep-link callback.

## HTTP endpoints

### Health

```http
GET /api/health
```

Response:

```json
{"status":"ok"}
```

### Public runtime configuration

```http
GET /api/platform/config.js
```

This returns browser-safe Manus runtime configuration as JavaScript. It must not be treated as a secret endpoint.

### OAuth callback

```http
GET /api/oauth/callback?code={code}&state={state}
```

This endpoint is intended for the browser OAuth flow. It verifies the one-time state cookie and sets the server session cookie. A native app should not call it directly without a mobile-specific redirect/deep-link flow.

### Stripe webhook

```http
POST /api/stripe/webhook
Content-Type: application/json
Stripe-Signature: t=...,v1=...
```

This endpoint is server-to-server. It requires the raw request body and a valid Stripe signature. It is not an app-client endpoint.

## tRPC calling convention

For a query, tRPC accepts a GET request. For a mutation, use POST with a JSON body. The client transformer is `superjson`; the simple JSON examples below work for the current primitive inputs.

Example public query:

```bash
curl "$BASE_URL/api/trpc/reviews.list?input=%7B%22json%22%3A%7B%22productId%22%3A1%7D%7D"
```

Example mutation shape:

```bash
curl -X POST "$BASE_URL/api/trpc/inventory.update" \
  -H 'Content-Type: application/json' \
  -H 'Cookie: webdev_app_session=YOUR_SESSION_COOKIE' \
  --data '{"json":{"productId":1,"stock":12,"lowStockThreshold":5}}'
```

For batched requests, use the tRPC batch format and an indexed input object. Most mobile clients should use `httpBatchLink` or `httpLink` instead of building the wire format manually.

## Admin API contract

All endpoints in this section require `adminProcedure`. A missing session returns an `UNAUTHORIZED` tRPC error. A signed-in non-admin user returns `FORBIDDEN` with the application message `You do not have required permission (10002)`.

### Admin session check

```text
admin.dashboard — query
input: none
```

Response:

```json
{
  "user": { "id": 1, "name": "Anna", "email": "anna@example.com", "role": "admin" },
  "message": "Admin access verified"
}
```

### Inventory

```text
inventory.list — query
input: none
```

The server ensures catalog products have inventory rows and returns `productId`, `productName`, `stock`, `lowStockThreshold`, and `updatedAt`.

```text
inventory.update — mutation
input: {
  productId: integer > 0,
  stock: integer 0..100000,
  lowStockThreshold: integer 0..100000
}
```

### Discounts

```text
discounts.list — query
input: none
```

```text
discounts.create — mutation
input: {
  code: string,              // 3–64 chars; normalized to uppercase on the server
  type: "percentage" | "fixed",
  value: positive integer,
  minOrderAmount: integer >= 0,
  endsAt?: ISO date string | null
}
```

Percentage values must be between 1 and 100. Fixed values and minimum order amounts are stored as تومان values in the current catalog model.

```text
discounts.toggle — mutation
input: { id: positive integer, isActive: boolean }
```

```text
discounts.remove — mutation
input: { id: positive integer }
```

### Reports

```text
reports.sales — query
input: { days?: integer 7..90 } // defaults to 30
```

The report is calculated from orders with `status = paid` and returns:

- `totalSales`
- `orderCount`
- `averageOrder`
- `dailySales[]` with `date`, `label`, `sales`, and `orders`
- `topProducts[]` with `productId`, `productName`, `quantity`, and `revenue`
- `inventory.totalProducts`
- `inventory.unitsInStock`
- `inventory.lowStockCount`
- `inventory.outOfStockCount`
- `inventory.lowStock[]`

### Admin logout

```text
auth.logout — mutation
input: none
```

Although the route is public, it clears the current session cookie. It should be called on logout from both web and any cookie-capable client.

## Customer and public API contract

### Current session

```text
auth.me — query
input: none
```

Returns the authenticated user or `null`.

### Product reviews

```text
reviews.list — query
input: { productId: positive integer }
```

Returns:

```json
{
  "average": 4.5,
  "count": 2,
  "reviews": [
    {
      "id": 10,
      "productId": 1,
      "userId": 4,
      "rating": 5,
      "title": "کیفیت عالی",
      "body": "...",
      "userName": "Anna",
      "createdAt": "..."
    }
  ]
}
```

```text
reviews.create — mutation
input: {
  productId: positive integer,
  rating: integer 1..5,
  title?: string <= 160 chars | null,
  body: string 10..2000 chars
}
```

The user must be authenticated and must have a `paid` order containing the product. Otherwise the server rejects the mutation.

### Checkout

```text
checkout.createSession — mutation
input: {
  origin: valid URL,
  items: [{ productId: positive integer, quantity: integer 1..10 }]
}
```

The user must be authenticated. The server validates catalog prices, creates a pending order, creates the Stripe Checkout Session, and returns the session result generated by the Stripe integration. The app should not mark an order paid based only on the browser return URL; payment status is finalized by the webhook.

### Own orders

```text
orders.mine — query
input: none
```

Returns orders belonging to the authenticated user, ordered newest first. It never returns another user's orders.

## React Native connection: current status

### Public read-only access

A mobile client can call public queries immediately using HTTPS and a tRPC client. A TypeScript React Native app can share the `AppRouter` type if the mobile project is part of the same monorepo:

```ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../server/routers";

export const api = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
    }),
  ],
});

const reviews = await api.reviews.list.query({ productId: 1 });
```

For a separately published mobile repository, generate or copy a stable API type contract rather than importing server source at runtime.

### Protected and admin access

The current backend does **not** expose a bearer-token login endpoint. Protected calls depend on the browser session cookie issued by the Manus OAuth callback. A native app therefore needs one of these approaches:

1. Use a browser-based OAuth session and a cookie jar that can persist and send `webdev_app_session` to the API. This is technically possible but is not yet a polished native authentication flow.
2. Add a mobile authentication bridge: native deep-link callback, short-lived access token, refresh token rotation, and server-side bearer-token verification.
3. Keep admin operations in the web admin panel instead of exposing them to the mobile app.

Do not put `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, Manus private keys, or any admin credential in the mobile bundle.

## Mobile readiness gaps

Before using this backend as a production mobile API, address these items:

- Add an explicit CORS allowlist for the mobile/web origins. The current Express entry point does not register CORS middleware.
- Add native OAuth redirect URIs and a mobile token exchange or use a supported Manus mobile authentication flow.
- Add access-token expiry, refresh-token rotation, revocation, and device/session management.
- Add API versioning, rate limiting, request IDs, and structured error envelopes.
- Add server-side inventory reservation/decrement after successful payment to prevent overselling.
- Connect custom discount records to checkout price calculation before exposing discount entry in a mobile checkout.
- Consider a REST/OpenAPI facade if the mobile team does not want to adopt tRPC.

## Recommended mobile rollout

For a first mobile release, expose public catalog/review reads and authenticated customer features first. Keep admin mutations behind a separate admin application or a distinct admin-scoped token. After mobile auth and CORS are added, use the same `AppRouter` procedures for checkout and order history, and keep all Stripe secret operations on the server.
