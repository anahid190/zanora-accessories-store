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

## 4. View order history

The `/orders` page requires a signed-in Manus account. It shows pending, paid, and failed order states from the database.

## 5. Review a product

Open `/product/1` and scroll to **نظرات و امتیازها**. Visitors can read approved reviews and the current average rating. A signed-in user can select a one-to-five-star rating and write a review after purchasing and paying for that product. The server verifies the paid order before accepting the review and labels published reviews as verified purchases.

## 6. Open the admin dashboard

Visit `/admin`. The page stays logged out until Manus OAuth succeeds. The server checks the authenticated user's role with `adminProcedure`; a normal user receives an access-denied state rather than the dashboard.

### Inventory

Open **موجودی** to edit each product's stock quantity and low-stock threshold. The values are persisted in the `inventory` table. Products at or below their threshold are marked as needing replenishment.

### Discounts

Open **تخفیف‌ها** to create percentage or fixed-value discount records. Each discount supports an optional minimum order amount, optional expiry date, and active/stopped state. Codes are normalized to uppercase and validated on the server.

### Sales reports

Open **گزارش‌ها** and switch between seven- and thirty-day views. The report calculates paid revenue, paid-order count, average order value, daily sales, best-selling products, units in stock, low-stock products, and out-of-stock products. The report seeds missing catalog inventory rows before calculating inventory health.

## 7. Webhook verification

The server receives Stripe events at `/api/stripe/webhook`. The route is registered before Express's JSON parser so the raw request bytes remain available for signature verification. Processed event IDs are stored in `processedStripeEvents`, making repeated delivery safe.

## Demo limitations

- The product catalog is intentionally small and uses editorial image URLs.
- Storefront prices are shown in تومان, while the Stripe demo uses a USD conversion.
- The top-level overview KPI cards and sample recent-order rows retain presentation/demo values; the dedicated reports tab uses paid-order data.
- Discount records are managed in the database; connecting these custom codes directly to the final Stripe amount is a separate production checkout step.
- Fulfillment, shipping labels, refunds, and production inventory synchronization are not implemented.
