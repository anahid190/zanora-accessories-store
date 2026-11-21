import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { inventory } from "../../drizzle/schema";
import { notifyOwner } from "./notification";

type Level = "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const counters = new Map<string, number>();
const alertCooldowns = new Map<string, number>();
const startedAt = Date.now();

export function incrementMetric(name: string, amount = 1) {
  counters.set(name, (counters.get(name) ?? 0) + amount);
}

export function getMetrics() {
  return Object.fromEntries(counters.entries());
}

export function logEvent(level: Level, event: string, fields: Fields = {}) {
  const payload = { timestamp: new Date().toISOString(), level, event, ...fields };
  if (level === "error") console.error(JSON.stringify(payload));
  else if (level === "warn") console.warn(JSON.stringify(payload));
  else console.log(JSON.stringify(payload));
}

export function recordRequest(method: string, path: string, status: number, durationMs: number, requestId: string) {
  incrementMetric("http.requests");
  incrementMetric(`http.status.${Math.floor(status / 100)}xx`);
  if (status >= 500) incrementMetric("http.errors.5xx");
  logEvent(status >= 500 ? "error" : "info", "http.request", { method, path, status, durationMs, requestId });
}

export async function reportIncident(event: string, fields: Fields = {}) {
  incrementMetric(`incident.${event}`);
  logEvent("error", event, fields);
  const cooldownKey = `${event}:${String(fields.route ?? fields.type ?? "global")}`;
  const lastSent = alertCooldowns.get(cooldownKey) ?? 0;
  if (Date.now() - lastSent < 5 * 60 * 1000) return;
  alertCooldowns.set(cooldownKey, Date.now());
  const content = JSON.stringify({ event, ...fields });
  const webhookUrl = process.env.MONITORING_WEBHOOK_URL?.trim();
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: `[Zanora] ${event}`, event, fields }), signal: AbortSignal.timeout(2500) });
    } catch (error) {
      logEvent("warn", "monitoring.webhook_failed", { event, error: error instanceof Error ? error.message : "unknown" });
    }
  }
  if (process.env.MONITORING_NOTIFY_OWNER === "true") {
    try { await notifyOwner({ title: `Zanora: ${event}`, content }); } catch (error) { logEvent("warn", "monitoring.owner_notification_failed", { event, error: error instanceof Error ? error.message : "unknown" }); }
  }
}

export async function getHealthSnapshot() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {
    process: { ok: true },
    stripe: { ok: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET), detail: "secret and webhook secret configured" },
  };
  try {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is not configured");
    await db.execute(sql`select 1`);
    checks.database = { ok: true };
    const outOfStock = await db.select({ productId: inventory.productId }).from(inventory).where(sql`${inventory.stock} - ${inventory.reservedStock} <= 0`).limit(10);
    checks.inventory = { ok: outOfStock.length === 0, detail: outOfStock.length ? `${outOfStock.length} product(s) out of stock` : "stock available" };
  } catch (error) {
    checks.database = { ok: false, detail: error instanceof Error ? error.message : "database unavailable" };
  }
  const ok = Object.values(checks).every((check) => check.ok);
  return { ok, status: ok ? "ok" : "degraded", uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000), checks, metrics: getMetrics() };
}

export async function monitorDependencies() {
  const snapshot = await getHealthSnapshot();
  if (!snapshot.checks.database.ok) await reportIncident("database.unhealthy", { detail: snapshot.checks.database.detail });
  if (snapshot.checks.inventory && !snapshot.checks.inventory.ok) await reportIncident("inventory.out_of_stock", { detail: snapshot.checks.inventory.detail });
  if (!snapshot.checks.stripe.ok) await reportIncident("stripe.configuration_missing");
  return snapshot;
}
