import crypto from "node:crypto";
import type { Request, Response } from "express";
import { products } from "../client/src/data/products";
import * as db from "./db";
import type { AuthenticatedUser } from "./_core/sdk";

const STRIPE_CURRENCY = "usd";
const TOMAN_PER_USD = 100_000;
const toStripeCents = (toman: number) => Math.max(50, Math.round(toman / (TOMAN_PER_USD / 100)));

function getSafeOrigin(requestOrigin: string | undefined, req: Request) {
  const candidate = requestOrigin || req.headers.origin;
  if (!candidate || !/^https:\/\//i.test(candidate)) throw new Error("A browser-visible HTTPS origin is required");
  return candidate.replace(/\/$/, "");
}

export async function createCheckoutSession(input: { origin: string; items: Array<{ productId: number; quantity: number }> }, user: AuthenticatedUser, req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured");
  const requested = input.items.map((item) => ({ product: products.find((product) => product.id === item.productId), quantity: Math.min(10, Math.max(1, Math.floor(item.quantity))) })).filter((item): item is { product: typeof products[number]; quantity: number } => Boolean(item.product));
  if (!requested.length) throw new Error("Cart is empty");
  const totalToman = requested.reduce((sum, item) => sum + item.product.priceValue * item.quantity, 0);
  const orderId = await db.createPendingOrder({ userId: user.id, amountTotal: totalToman, customerEmail: user.email, customerName: user.name, items: requested.map(({ product, quantity }) => ({ productId: product.id, productName: product.name, unitAmount: product.priceValue, quantity })) });
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("allow_promotion_codes", "true");
  params.set("success_url", `${getSafeOrigin(input.origin, req)}/orders?payment=success`);
  params.set("cancel_url", `${getSafeOrigin(input.origin, req)}/cart?payment=cancelled`);
  params.set("client_reference_id", String(orderId));
  params.set("metadata[orderId]", String(orderId));
  params.set("metadata[userId]", String(user.id));
  params.set("payment_intent_data[metadata][orderId]", String(orderId));
  if (user.email) params.set("customer_email", user.email);
  requested.forEach(({ product, quantity }, index) => {
    params.set(`line_items[${index}][quantity]`, String(quantity));
    params.set(`line_items[${index}][price_data][currency]`, STRIPE_CURRENCY);
    params.set(`line_items[${index}][price_data][unit_amount]`, String(toStripeCents(product.priceValue)));
    params.set(`line_items[${index}][price_data][product_data][name]`, product.name);
    params.set(`line_items[${index}][price_data][product_data][description]`, `${product.category} · Zanora`);
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const session = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !session.id || !session.url) throw new Error(session.error?.message || "Stripe Checkout session failed");
  await db.attachStripeSession(orderId, session.id);
  return { url: session.url, orderId };
}

function verifySignature(payload: Buffer, signature: string, secret: string) {
  const timestamp = signature.split(",").find((part) => part.startsWith("t="))?.slice(2);
  const signatures = signature.split(",").filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload.toString("utf8")}`).digest("hex");
  return signatures.some((candidate) => candidate.length === expected.length && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)));
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.header("stripe-signature");
  const payload = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  if (!secret || !signature || !verifySignature(payload, signature, secret)) { res.status(400).json({ error: "Invalid Stripe signature" }); return; }
  let event: { id: string; type: string; data: { object: Record<string, any> } };
  try { event = JSON.parse(payload.toString("utf8")); } catch { res.status(400).json({ error: "Invalid event payload" }); return; }
  if (await db.hasProcessedStripeEvent(event.id)) { res.json({ received: true, duplicate: true }); return; }
  await db.recordStripeEvent(event.id, event.type);
  const object = event.data?.object ?? {};
  if (event.type === "checkout.session.completed" && object.metadata?.orderId) await db.markOrderPaid(Number(object.metadata.orderId), typeof object.payment_intent === "string" ? object.payment_intent : null);
  if (event.type === "payment_intent.payment_failed" && typeof object.metadata?.orderId === "string") await db.markOrderFailed(Number(object.metadata.orderId), typeof object.id === "string" ? object.id : null);
  res.json({ received: true });
}
