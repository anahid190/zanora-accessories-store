# Zanora Demo Guide

## 1. Browse the storefront

Start at the homepage and scroll to the product section. Open **Advanced filters** to combine a product category with a price band. The sort control supports newest, lowest price, and highest price.

## 2. Add an item

Open a product detail page or use the product card's add button. The cart counter updates immediately and the cart persists after a refresh because it is stored in `localStorage`.

## 3. Authenticate and pay

Open `/cart` and select checkout. Guests are redirected to Manus OAuth before a payment session can be created. After authentication, the server validates the product IDs and quantities, creates a pending order, creates a Stripe Checkout Session, and links the Stripe session to the order.

For the Stripe test environment, use:

```text
Card: 4242 4242 4242 4242
Expiry: any future date
CVC: any three digits
```

Do not treat the browser return URL as proof of payment. The order changes to `paid` only after the signed `checkout.session.completed` webhook is accepted.

## 4. View order history

The `/orders` page requires a signed-in Manus account. It shows pending, paid, and failed order states from the database.

## 5. Open the admin dashboard

Visit `/admin`. The page stays logged out until Manus OAuth succeeds. The server checks the authenticated user's role with `adminProcedure`; a normal user receives an access-denied state rather than the dashboard.

The dashboard currently contains demo metrics and catalog inventory rows. Connect those widgets to live operational data before using it as a production back office.

## 6. Webhook verification

The server receives Stripe events at `/api/stripe/webhook`. The route is registered before Express's JSON parser so the raw request bytes remain available for signature verification. Processed event IDs are stored in `processedStripeEvents`, making repeated delivery safe.

## Demo limitations

- The product catalog is intentionally small and uses editorial image URLs.
- Storefront prices are shown in تومان, while the Stripe demo uses USD conversion.
- The admin dashboard metrics and low-stock notices are still demo data.
- Fulfillment, shipping labels, refunds, and production inventory synchronization are not implemented.
