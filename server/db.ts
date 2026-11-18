import { desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { discounts, inventory, InsertUser, orderItems, orders, processedStripeEvents, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => { if (user[field] !== undefined) { const value = user[field] ?? null; values[field] = value; updateSet[field] = value; } });
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPendingOrder(input: { userId: number; amountTotal: number; customerEmail?: string | null; customerName?: string | null; items: Array<{ productId: number; productName: string; unitAmount: number; quantity: number }> }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const result = await db.insert(orders).values({ userId: input.userId, amountTotal: input.amountTotal, customerEmail: input.customerEmail ?? null, customerName: input.customerName ?? null }).$returningId();
  const orderId = result[0]?.id;
  if (!orderId) throw new Error("Could not create order");
  await db.insert(orderItems).values(input.items.map((item) => ({ ...item, orderId })));
  return orderId;
}

export async function attachStripeSession(orderId: number, sessionId: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(orders).set({ stripeCheckoutSessionId: sessionId }).where(eq(orders.id, orderId));
}

export async function markOrderPaid(orderId: number, paymentIntentId?: string | null) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(orders).set({ status: "paid", stripePaymentIntentId: paymentIntentId ?? null }).where(eq(orders.id, orderId));
}

export async function markOrderFailed(orderId: number, paymentIntentId?: string | null) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(orders).set({ status: "failed", stripePaymentIntentId: paymentIntentId ?? null }).where(eq(orders.id, orderId));
}

export async function listOrdersForUser(userId: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function hasProcessedStripeEvent(eventId: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const result = await db.select({ eventId: processedStripeEvents.eventId }).from(processedStripeEvents).where(eq(processedStripeEvents.eventId, eventId)).limit(1);
  return result.length > 0;
}

export async function recordStripeEvent(eventId: string, eventType: string) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.insert(processedStripeEvents).values({ eventId, eventType }).onDuplicateKeyUpdate({ set: { eventType } });
}

export async function listInventory(productCatalog: Array<{ id: number; name: string }>) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const ids = productCatalog.map((product) => product.id);
  const existing = await db.select().from(inventory).where(inArray(inventory.productId, ids));
  const existingIds = new Set(existing.map((item) => item.productId));
  const missing = productCatalog.filter((product) => !existingIds.has(product.id));
  if (missing.length) await db.insert(inventory).values(missing.map((product) => ({ productId: product.id, productName: product.name, stock: 10, lowStockThreshold: 5 })));
  return db.select().from(inventory).where(inArray(inventory.productId, ids)).orderBy(inventory.productId);
}

export async function updateInventory(productId: number, stock: number, lowStockThreshold: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(inventory).set({ stock, lowStockThreshold }).where(eq(inventory.productId, productId));
  const result = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
  return result[0];
}

export async function listDiscounts() {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  return db.select().from(discounts).orderBy(desc(discounts.createdAt));
}

export async function createDiscount(input: { code: string; type: "percentage" | "fixed"; value: number; minOrderAmount: number; endsAt?: Date | null }) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,64}$/.test(code)) throw new Error("کد تخفیف باید فقط شامل حروف انگلیسی، عدد، خط تیره یا زیرخط باشد");
  if (input.type === "percentage" && (input.value < 1 || input.value > 100)) throw new Error("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد");
  if (input.type === "fixed" && input.value < 1) throw new Error("مبلغ تخفیف نامعتبر است");
  const result = await db.insert(discounts).values({ code, type: input.type, value: input.value, minOrderAmount: input.minOrderAmount, endsAt: input.endsAt ?? null });
  const id = result[0]?.insertId;
  if (!id) throw new Error("تخفیف ایجاد نشد");
  const created = await db.select().from(discounts).where(eq(discounts.id, Number(id))).limit(1);
  return created[0];
}

export async function toggleDiscount(id: number, isActive: boolean) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.update(discounts).set({ isActive: isActive ? 1 : 0 }).where(eq(discounts.id, id));
  const result = await db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
  return result[0];
}

export async function deleteDiscount(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not available");
  await db.delete(discounts).where(eq(discounts.id, id));
  return { success: true } as const;
}
