/**
 * FEATURE 1 — Secure User Authentication: Login Rate Limiting
 *
 * Applies a strict per-IP rate limit exclusively to the login endpoint.
 * This is separate from the global limiter in app.ts (which allows 300 req/15 min)
 * so that brute-force password attacks are blocked at 5 attempts per 15 minutes
 * without affecting other API endpoints.
 *
 * Reads optional env vars:
 *   LOGIN_MAX_ATTEMPTS   (default: 5)
 *   LOGIN_WINDOW_MINUTES (default: 15)
 */
export declare const loginRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
