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

import { rateLimit } from 'express-rate-limit';

const maxAttempts = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);
const windowMinutes = parseInt(process.env.LOGIN_WINDOW_MINUTES || '15', 10);

export const loginRateLimiter = rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  max: maxAttempts,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: `Too many login attempts. Please wait ${windowMinutes} minutes before trying again.`,
  },
  // Key by IP address (default). In production behind a proxy, set app.set('trust proxy', 1)
  // so that req.ip resolves to the real client IP, not the proxy IP.
  skipSuccessfulRequests: true, // Only count failed/errored requests toward the limit
});
