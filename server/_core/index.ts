import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe";
import { releaseExpiredReservations } from "../db";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const allowedOrigins = new Set((process.env.APP_CORS_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean));
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  app.use((req, res, next) => { const requestId = req.header("x-request-id") || crypto.randomUUID(); res.setHeader("x-request-id", requestId); res.setHeader("X-Content-Type-Options", "nosniff"); res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin"); res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()"); const origin = req.header("origin"); if (origin && allowedOrigins.has(origin)) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Access-Control-Allow-Credentials", "true"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Request-Id"); res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); res.setHeader("Vary", "Origin"); } if (req.method === "OPTIONS" && origin && allowedOrigins.has(origin)) { res.status(204).end(); return; } next(); });
  app.use((req, res, next) => { if (!req.path.startsWith("/api/trpc") && !req.path.startsWith("/api/oauth/mobile")) return next(); const now = Date.now(); const key = `${req.ip}:${req.path}`; const bucket = rateBuckets.get(key); if (!bucket || bucket.resetAt <= now) rateBuckets.set(key, { count: 1, resetAt: now + 60_000 }); else { bucket.count += 1; if (bucket.count > 120) { res.status(429).json({ error: "Too many requests", retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }); return; } } next(); });
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  void releaseExpiredReservations().catch((error) => console.warn("[Reservations] Initial sweep failed:", error instanceof Error ? error.message : "unknown error"));
  const reservationSweep = setInterval(() => { void releaseExpiredReservations().catch((error) => console.warn("[Reservations] Sweep failed:", error instanceof Error ? error.message : "unknown error")); }, 60_000);
  reservationSweep.unref();
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
