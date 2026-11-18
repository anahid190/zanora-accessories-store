import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, orderItems, orders, processedStripeEvents, users } from "../drizzle/schema";
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
