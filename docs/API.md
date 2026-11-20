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
5. The server verifies the state nonce, exchanges the code, upserts the user, creates a one-year web session token, and sets the `webdev_app_session` cookie.
6. The browser is redirected to `/`.

The session cookie is configured for HTTPS cross-site Preview embedding with `SameSite=None; Secure`. Native mobile login uses the allowlisted deep-link callback and receives a 15-minute access token plus a rotating 30-day refresh token. Mobile sessions are stored server-side and can be revoked individually through the refresh token or all at once for the user.

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

### Mobile token exchange and session management

```http
POST /api/oauth/mobile/exchange
Content-Type: application/json
{ "code": "one-time-code-from-deep-link" }
```

The response contains `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900 }`. Send the access token as `Authorization: Bearer ...` to the tRPC API. Access tokens expire after 15 minutes.

```http
POST /api/oauth/mobile/refresh
{ "refreshToken": "..." }

POST /api/oauth/mobile/revoke
{ "refreshToken": "..." }

GET /api/oauth/mobile/sessions
Authorization: Bearer ACCESS_TOKEN

POST /api/oauth/mobile/sessions/revoke-all
Authorization: Bearer ACCESS_TOKEN
```

Refresh tokens are rotated on every successful refresh; the previous token is immediately invalid. Revoked or expired sessions are rejected even if an old access JWT has not reached its `exp` time.

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

The server ensures catalog products have inventory rows and returns `productId`, `productName`, physical `stock`, `reservedStock`, `stock - reservedStock` as available-to-sell in the client, `lowStockThreshold`, and `updatedAt`.

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

### Product catalog

```text
catalog.list — public query
catalog.get — public query, input: { id: positive integer }
catalog.adminList — admin query
catalog.create — admin mutation
catalog.update — admin mutation, input includes id, name, category, priceValue, image, gallery[], badge, description
catalog.archive — admin mutation, input: { id: positive integer }
```

The catalog is seeded from the initial product set on first access. Public queries return only active products. Admin archive is a soft archive: it hides the product from the storefront while preserving its numeric ID for historical order items.

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
checkout.quote — mutation
input: {
  items: [{ productId: positive integer, quantity: integer 1..10 }],
  discountCode?: string | null
}
```

The quote validates the catalog items and discount code and returns `subtotalAmount`, `discountAmount`, `shippingAmount`, `amountTotal`, and the normalized `discountCode`. It is protected so the mobile/web client can request a trusted quote after login. The final checkout mutation recalculates the quote on the server.

```text
checkout.createSession — mutation
input: {
  origin: valid URL,
  addressId: positive integer,
  items: [{ productId: positive integer, quantity: integer 1..10 }],
  discountCode?: string | null
}
```

The user must be authenticated. `addressId` must belong to the authenticated user. The server copies the selected recipient, phone, province, city, address, and postal code into the order snapshot, so later address edits do not change historical orders. It then validates catalog prices, discount rules, and available stock, creates a pending order, atomically reserves inventory for 30 minutes, creates Stripe line items with the discount and shipping already reflected, and returns the session result generated by the Stripe integration. Reservations are released on failed/canceled/expired checkout and converted into physical stock decrement after a successful webhook. The app should not mark an order paid based only on the browser return URL; payment status is finalized by the webhook.

### Own orders

```text
orders.mine — query
input: none
```

Returns orders belonging to the authenticated user, ordered newest first. It includes each order's line items and the stored subtotal, discount, shipping, and final amounts. It never returns another user's orders.

### Customer profile and addresses

```text
profile.update — mutation
input: { name: string, 2..120 chars }

profile.addresses — query
input: none

profile.addAddress — mutation
input: {
  recipient: string,
  phone: string,
  province: string,
  city: string,
  address: string,
  postalCode: string,
  isDefault: boolean
}

profile.removeAddress — mutation
input: { id: positive integer }

profile.setDefaultAddress — mutation
input: { id: positive integer }
```

All profile and address procedures are protected. Address mutations always scope the record to the authenticated user.

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

The backend now supports a native OAuth bridge:

1. Open `GET /api/oauth/mobile/start?redirectUri=zanora://oauth/callback` in the system browser. The URI must be present in the server's `MOBILE_REDIRECT_URIS` allowlist.
2. Complete Manus OAuth. The callback redirects to the native URI with a short-lived one-time `code`.
3. Exchange the code:

```http
POST /api/oauth/mobile/exchange
Content-Type: application/json

{"code":"ONE_TIME_CODE"}
```

The response contains a 30-day signed session token:

```json
{"accessToken":"...","tokenType":"Bearer","expiresIn":2592000}
```

Send it on tRPC calls with `Authorization: Bearer {accessToken}`. The same token supports customer procedures and, for an authenticated admin, admin procedures.

The server also supports an explicit CORS allowlist through `APP_CORS_ORIGINS`, request IDs through `x-request-id`, and a basic per-IP rate limit for tRPC and mobile OAuth endpoints.

Do not put `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `DATABASE_URL`, Manus private keys, or any admin credential in the mobile bundle.

## Mobile readiness gaps

Remaining production mobile work:

- Add access-token expiry, refresh-token rotation, revocation, and device/session management.
- Add API versioning and structured error envelopes.
- Add delivery/fulfillment status and carrier integrations after payment.
- Consider a REST/OpenAPI facade if the mobile team does not want to adopt tRPC.

## Recommended mobile rollout

For a first mobile release, expose public catalog/review reads and authenticated customer features first. Keep admin mutations behind a separate admin application and do not distribute owner credentials in the app. Use the same `AppRouter` procedures for checkout and order history, and keep all Stripe secret operations on the server.
