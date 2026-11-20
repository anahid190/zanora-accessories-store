import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import crypto from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isAllowedMobileRedirect(redirectUri: string) {
  const configured = (process.env.MOBILE_REDIRECT_URIS || "zanora://oauth/callback").split(",").map((value) => value.trim()).filter(Boolean);
  return configured.includes(redirectUri);
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/mobile/start", (req: Request, res: Response) => {
    const redirectUri = getQueryParam(req, "redirectUri");
    if (!redirectUri || !isAllowedMobileRedirect(redirectUri)) { res.status(400).json({ error: "A registered mobile redirectUri is required" }); return; }
    const nonce = crypto.randomUUID();
    res.cookie(OAUTH_STATE_COOKIE, nonce, { path: "/", maxAge: 600_000, httpOnly: true, secure: true, sameSite: "none" });
    const state = encodeOAuthState({ redirectUri, nonce });
    const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol; const publicOrigin = process.env.PUBLIC_APP_ORIGIN || `${forwardedProto}://${req.get("host")}`; const url = new URL(`${ENV.oAuthServerUrl}/app-auth`); url.searchParams.set("appId", ENV.appId); url.searchParams.set("redirectUri", `${publicOrigin.replace(/\/$/, "")}/api/oauth/callback`); url.searchParams.set("state", state); url.searchParams.set("responseType", "code");
    res.redirect(302, url.toString());
  });

  app.post("/api/oauth/mobile/exchange", async (req: Request, res: Response) => {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (!code) { res.status(400).json({ error: "code is required" }); return; }
    try { const openId = await db.consumeMobileAuthCode(code); if (!openId) { res.status(400).json({ error: "Invalid or expired mobile auth code" }); return; } const user = await db.getUserByOpenId(openId); if (!user) { res.status(401).json({ error: "User not found" }); return; } const managed = await db.createAuthSession(openId, req.header("user-agent")); const accessToken = await sdk.createSessionToken(openId, { name: user.name || "", expiresInMs: 15 * 60 * 1000, sessionId: managed.sessionId }); res.json({ accessToken, refreshToken: managed.refreshToken, tokenType: "Bearer", expiresIn: 15 * 60 }); } catch (error) { console.error("[OAuth] Mobile exchange failed", error instanceof Error ? error.message : "unknown error"); res.status(500).json({ error: "Mobile authentication failed" }); }
  });

  app.post("/api/oauth/mobile/refresh", async (req: Request, res: Response) => {
    const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
    if (!refreshToken) { res.status(400).json({ error: "refreshToken is required" }); return; }
    try { const rotated = await db.rotateAuthSession(refreshToken, req.header("user-agent")); if (!rotated) { res.status(401).json({ error: "Invalid, expired, or revoked refresh token" }); return; } const user = await db.getUserByOpenId(rotated.openId); if (!user) { res.status(401).json({ error: "User not found" }); return; } const accessToken = await sdk.createSessionToken(rotated.openId, { name: user.name || "", expiresInMs: 15 * 60 * 1000, sessionId: rotated.sessionId }); res.json({ accessToken, refreshToken: rotated.refreshToken, tokenType: "Bearer", expiresIn: 15 * 60 }); } catch (error) { console.error("[OAuth] Mobile refresh failed", error instanceof Error ? error.message : "unknown error"); res.status(500).json({ error: "Mobile token refresh failed" }); }
  });

  app.post("/api/oauth/mobile/revoke", async (req: Request, res: Response) => { const refreshToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : ""; if (!refreshToken) { res.status(400).json({ error: "refreshToken is required" }); return; } await db.revokeAuthSession(refreshToken); res.json({ success: true }); });
  app.get("/api/oauth/mobile/sessions", async (req: Request, res: Response) => { try { const user = await sdk.authenticateRequest(req); res.json({ sessions: await db.listAuthSessions(user.openId) }); } catch { res.status(401).json({ error: "Valid Bearer access token is required" }); } });
  app.post("/api/oauth/mobile/sessions/revoke-all", async (req: Request, res: Response) => { try { const user = await sdk.authenticateRequest(req); await db.revokeAllAuthSessions(user.openId); res.json({ success: true }); } catch { res.status(401).json({ error: "Valid Bearer access token is required" }); } });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. An attacker can
    // forge `state`, but cannot plant this cookie in the victim's browser.
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const redirectUri = decodeOAuthState(state).redirectUri;
      if (isAllowedMobileRedirect(redirectUri)) {
        const mobileCode = await db.createMobileAuthCode(userInfo.openId);
        const mobileRedirect = new URL(redirectUri); mobileRedirect.searchParams.set("code", mobileCode); res.redirect(302, mobileRedirect.toString()); return;
      }

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
