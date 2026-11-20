# Zanora — Women's Accessories Store

Zanora is a Persian, right-to-left women's accessories storefront with a refined editorial visual system. The project includes product discovery, advanced filters, a persistent shopping cart, authenticated admin access, Stripe Checkout, order history, inventory management, discount codes, sales analytics, and product reviews.

## Demo

**Live preview:** [Open the Zanora demo](https://3000-iq0q1xkaxu3y0uwesdsx3-e3aa4ebb.us3.manus.computer/)

Key routes:

- `/` — storefront homepage with category and price filters
- `/product/:id` — product detail page
- `/cart` — persistent shopping cart and checkout
- `/orders` — authenticated order history
- `/account` — customer profile and saved shipping addresses
- `/admin` — Manus OAuth-protected admin dashboard

API and mobile integration documentation is available in [`docs/API.md`](docs/API.md). It covers tRPC procedures, admin authorization, OAuth session behavior, request examples, and the current mobile-readiness gaps.

> The preview URL is a development/demo environment. For production, publish the project and configure a stable domain.

## Features

### Storefront

- Persian RTL layout with responsive desktop and mobile design
- Editorial hero section and category cards
- Advanced category filters for earrings, necklaces, bracelets, and bags
- Price-range filters and newest/lowest/highest price sorting
- Product details with gallery, quantity selection, color selection, and add-to-cart
- Database-backed product catalog with admin create, edit, archive, descriptions, badges, and multi-image galleries
- Cart state persisted in browser `localStorage`

### Checkout and orders

- Stripe Checkout Session creation on the server
- Server-side product and price validation
- Orders and order items persisted in MySQL through Drizzle ORM
- Server-validated percentage/fixed discount codes with minimum order and expiry checks
- Atomic inventory reservation at checkout, release on failure/expiry, and decrement after successful payment
- Stripe webhook signature verification using the exact raw request body
- Idempotent Stripe event processing
- Payment status history in `/orders`
- Expandable order details with items, shipping, discount, and final totals
- Provider-agnostic fulfillment metadata, carrier tracking, shipping label links, Stripe refunds, and customer notifications
- Customer account page at `/account` with profile and saved shipping addresses
- Address selection during checkout with immutable order-level shipping snapshots

The storefront displays prices in Iranian تومان. Stripe Checkout uses a test USD conversion because Stripe does not support Iranian تومان as a settlement currency in this integration. The current demo conversion is 100,000 تومان = 1 USD.

### Admin

- Manus OAuth login gate
- Server-side `adminProcedure` authorization
- Owner/admin role resolution from the authenticated Manus identity
- Sales metrics, recent orders, low-stock products, product search, and logout
- Live overview KPIs and recent orders from paid/current-month database data
- Inventory controls for stock quantity and low-stock thresholds, persisted in MySQL
- Reserved-stock visibility and available-to-sell calculations
- Discount management for percentage or fixed discounts, minimum order amounts, expiry dates, and activation state
- Sales reporting for paid orders, daily revenue, average order value, top products, and inventory health
- Product reviews and five-star ratings, with verified-purchase enforcement before publishing
- Mobile OAuth sessions with short-lived access tokens, rotating refresh tokens, revoke, and multi-device session management

## Tech stack

- React 19 + Vite + TypeScript
- Express + tRPC
- Drizzle ORM + MySQL
- Stripe Checkout + signed webhooks
- Manus OAuth
- Wouter routing
- Lucide icons
- pnpm

## Local development

Requirements: Node.js 20+, pnpm 10+, and a MySQL-compatible database.

```bash
pnpm install
pnpm db:push
pnpm dev
```

The development server listens on port `3000` by default.

For a static client preview only:

```bash
pnpm dev:static
```

Validation and production builds:

```bash
pnpm check
pnpm build
```

## Environment variables

The managed Manus runtime supplies OAuth and Stripe variables. For a self-hosted environment, configure the equivalent values before starting the server:

```env
DATABASE_URL=mysql://user:password@host:3306/zanora
MANUS_PROJECT_ID=your-project-id
MANUS_OAUTH_API_URL=https://oauth.example.com
MANUS_JWT_SECRET=your-session-secret
OWNER_OPEN_ID=your-owner-open-id
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
APP_CORS_ORIGINS=https://app.example.com,https://admin.example.com
MOBILE_REDIRECT_URIS=zanora://oauth/callback
PUBLIC_APP_ORIGIN=https://shop.example.com
```

Never commit real secrets. Stripe secrets are consumed only by the server; card numbers, CVCs, and expiry dates are never stored by the application.

## Stripe test flow

1. Open the demo and add a product to the cart.
2. Sign in with Manus when checkout asks for authentication.
3. Continue to Stripe Checkout.
4. Use Stripe's test card `4242 4242 4242 4242`, any future expiry date, and any three-digit CVC.
5. Return to `/orders` to see the order status after the webhook is received.

The Stripe webhook endpoint is `/api/stripe/webhook`. It rejects unsigned or stale webhook requests and deduplicates repeated Stripe event IDs.

## Database

The schema is in `drizzle/schema.ts`. The current migrations create `users`, `orders`, `orderItems`, `processedStripeEvents`, `inventory`, `discounts`, `productReviews`, `customerAddresses`, `mobileAuthCodes`, `authSessions`, and `catalogProducts`.

Generate and apply migrations with:

```bash
pnpm db:push
```

## Project structure

```text
client/src/pages/       Storefront, product, cart, orders, and admin pages
client/src/contexts/    Persistent cart/store context
client/src/data/        Central product catalog
server/                 Express, tRPC, auth, database, and Stripe code
drizzle/                Database schema and migrations
public/                 Route manifest and brand assets
docs/DEMO.md            Step-by-step demo walkthrough
docs/API.md             Admin API contract and mobile integration guide
```

## Production checklist

- Publish the project behind a stable HTTPS domain.
- Claim/configure the Stripe sandbox, then replace test keys with live keys in the managed integration settings.
- Verify the production webhook endpoint and inspect Stripe delivery logs.
- Replace the demo product catalog with the operational catalog and verify stock opening balances.
- Add a fulfillment workflow for paid orders.
- Review the تومان-to-USD pricing strategy with the payment provider before going live.
- Register production mobile redirect URIs and configure `APP_CORS_ORIGINS` with an explicit allowlist.

## License

This project is provided as an application demo. Add the license and business terms appropriate for your deployment before public distribution.
