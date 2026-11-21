import "dotenv/config";
import crypto from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe";
import { releaseExpiredReservations } from "../db";
import { checkRateLimit, rateLimitHeaders } from "./rateLimit";
import { logEvent, monitorDependencies, recordRequest, reportIncident } from "./monitoring";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const allowedOrigins = new Set((process.env.APP_CORS_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = req.header("x-request-id") || crypto.randomUUID();
    const startedAt = Date.now();
    res.setHeader("x-request-id", requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    const origin = req.header("origin");
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Request-Id");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Vary", "Origin");
    }
    res.on("finish", () => recordRequest(req.method, req.path, res.statusCode, Date.now() - startedAt, requestId));
    if (req.method === "OPTIONS" && origin && allowedOrigins.has(origin)) { res.status(204).end(); return; }
    next();
  });

  app.use(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.path.startsWith("/api/trpc") && !req.path.startsWith("/api/oauth/mobile")) return next();
    const result = await checkRateLimit(`${req.ip}:${req.path}`, 120);
    for (const [header, value] of Object.entries(rateLimitHeaders(result))) res.setHeader(header, value);
    if (!result.allowed) {
      const retryAfterSeconds = Math.max(1, result.resetAt - Math.floor(Date.now() / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: "Too many requests", retryAfterSeconds });
      return;
    }
    next();
  });

  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res, next) => {
    try { await handleStripeWebhook(req, res); }
    catch (error) { await reportIncident("stripe.webhook_failed", { requestId: req.header("x-request-id"), error: error instanceof Error ? error.message : "unknown" }); next(error); }
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/health/deep", async (_req, res) => {
    const snapshot = await monitorDependencies();
    res.status(snapshot.ok ? 200 : 503).json(snapshot);
  });
  app.get("/api/platform/config.js", (_req, res) => res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript()));
  registerOAuthRoutes(app);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    void reportIncident("http.unhandled_error", { requestId: req.header("x-request-id"), route: req.path, error: error instanceof Error ? error.message : "unknown" });
    if (res.headersSent) return;
    res.status(500).json({ error: "Internal server error", requestId: req.header("x-request-id") });
  });

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", (error) => { logEvent("error", "server.error", { error: error.message }); process.exit(1); });
  process.on("unhandledRejection", (reason) => { void reportIncident("process.unhandled_rejection", { error: reason instanceof Error ? reason.message : String(reason) }); });
  process.on("uncaughtException", (error) => { void reportIncident("process.uncaught_exception", { error: error.message }); });
  void releaseExpiredReservations().catch((error) => void reportIncident("reservations.initial_sweep_failed", { error: error instanceof Error ? error.message : "unknown" }));
  const reservationSweep = setInterval(() => { void releaseExpiredReservations().catch((error) => void reportIncident("reservations.sweep_failed", { error: error instanceof Error ? error.message : "unknown" })); }, 60_000);
  reservationSweep.unref();
  const dependencyMonitor = setInterval(() => { void monitorDependencies(); }, 60_000);
  dependencyMonitor.unref();
  server.listen(port, "0.0.0.0", () => logEvent("info", "server.started", { port, rateLimitBackend: process.env.UPSTASH_REDIS_REST_URL ? "redis" : "memory-fallback" }));
}

startServer().catch((error) => { logEvent("error", "server.start_failed", { error: error instanceof Error ? error.message : "unknown" }); process.exit(1); });
