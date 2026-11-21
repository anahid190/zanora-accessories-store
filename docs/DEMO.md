# Zanora Demo Guide

The live preview is available from the project Preview panel. The same application exposes the following page routes:

- `/` — Persian storefront with category, price, and sort filters
- `/product/1` — product gallery, purchase controls, rating, and reviews
- `/cart` — persistent cart and checkout entry point
- `/orders` — signed-in order history
- `/admin` — Manus OAuth-protected admin dashboard

## 1. Browse the storefront

Start at the homepage and scroll to the product section. Open **Advanced filters** to combine a product category with a price band. The sort control supports newest, lowest price, and highest price.

## 2. Add an item

Open a product detail page or use the product card's add button. The cart counter updates immediately and the cart persists after a refresh because it is stored in `localStorage`.

## 3. Authenticate and pay

Open `/cart` and select checkout. Guests are redirected to Manus OAuth before a payment session can be created. After authentication, the server validates product IDs and quantities, creates a pending order, creates a Stripe Checkout Session, and links the Stripe session to the order.

For the Stripe test environment, use:

```text
Card: 4242 4242 4242 4242
Expiry: any future date
CVC: any three digits
```

Do not treat the browser return URL as proof of payment. The order changes to `paid` only after the signed `checkout.session.completed` webhook is accepted.

## 4. Apply a discount and view order history

If an active code exists, enter it in the cart's **کد تخفیف** field. The server validates the code, minimum purchase, active state, and expiry before showing the discount. The same validation is repeated while creating Checkout, so the browser cannot change the final amount. Checkout reserves the requested stock for 30 minutes; failed, canceled, and expired pending orders release the reservation.

Select an address in the **آدرس تحویل سفارش** section before continuing to payment. Checkout verifies that the address belongs to the signed-in customer and copies its recipient, phone, location, postal code, and full address into the order snapshot. Editing the address later does not modify the historical order.

The `/orders` page requires a signed-in Manus account. It shows pending, paid, and failed order states from the database.

Expand an order to inspect its line items, shipping amount, applied discount, and final total. After a successful Stripe webhook, physical stock is decremented and the reservation is released.

## 5. Review a product

Open `/product/1` and scroll to **نظرات و امتیازها**. Visitors can read approved reviews and the current average rating. A signed-in user can select a one-to-five-star rating and write a review after purchasing and paying for that product. The server verifies the paid order before accepting the review and labels published reviews as verified purchases.

## 6. Open the admin dashboard

Visit `/admin`. The page stays logged out until Manus OAuth succeeds. The server checks the authenticated user's role with `adminProcedure`; a normal user receives an access-denied state rather than the dashboard.

### Inventory

Open **موجودی** to edit each product's physical stock quantity and low-stock threshold. The values are persisted in the `inventory` table. The panel also shows active reservations and available-to-sell stock. Physical stock cannot be edited below the currently reserved quantity.

### Product catalog

Open **محصولات** to create or edit catalog products. The editor stores the name, category, Toman price, badge, description, primary image, and additional gallery URLs in `catalogProducts`. Archiving hides a product from the public catalog without deleting historical order references. The storefront reads active products through `catalog.list`.

### Discounts

Open **تخفیف‌ها** to create percentage or fixed-value discount records. Each discount supports an optional minimum order amount, optional expiry date, and active/stopped state. Codes are normalized to uppercase and validated on the server.

### Sales reports

The overview now shows live current-month sales, paid order count, new customers, average paid order, recent orders, and low-stock alerts. Open **گزارش‌ها** and switch between seven- and thirty-day views for paid revenue, daily sales, best-selling products, units available to sell, low-stock products, and out-of-stock products.

## 7. Manage the customer account

Visit `/account` after signing in. Customers can edit their display name, add/remove shipping addresses, choose a default address, and jump to the expandable order history at `/orders`.

## 8. Webhook verification

The server receives Stripe events at `/api/stripe/webhook`. The route is registered before Express's JSON parser so the raw request bytes remain available for signature verification. Processed event IDs are stored in `processedStripeEvents`, making repeated delivery safe.

## 9. Operations monitoring

The API exposes `/api/health` as a lightweight liveness check and `/api/health/deep` as a dependency check. The deep response includes database connectivity, Stripe configuration, inventory exhaustion, uptime, and structured request/error counters. The server emits JSON logs with `event`, `requestId`, status, and duration fields, and can forward incident alerts to `MONITORING_WEBHOOK_URL`.

API and mobile OAuth requests include `RateLimit-*` headers. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to share the 120-requests-per-minute window across instances. Without Redis, a bounded per-process fallback is used and identified by `X-RateLimit-Backend: memory-fallback`.

## Demo limitations

- The product catalog is intentionally small and uses editorial image URLs.
- Storefront prices are shown in تومان, while the Stripe demo uses a USD conversion.
- Carrier synchronization remains provider-agnostic: fulfillment status, carrier, tracking code, label URL, refunds, and customer notifications are supported, while direct carrier API synchronization requires a provider credential.
