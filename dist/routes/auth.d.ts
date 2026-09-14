/**
 * Auth Routes
 *
 * FEATURE 1 — Secure User Authentication:
 *   - loginRateLimiter applied to POST /login (5 attempts / 15 min)
 *   - bcrypt hash (cost 12) on register; never store plaintext
 *   - JWT startup guard: refuses dev-default secret in production
 *
 * FEATURE 6 — Seller Verification:
 *   - POST /register sends a 6-digit OTP email and stores a VerificationToken
 *   - POST /verify-email validates OTP, sets isVerified=true, logs audit
 */
declare const router: import("express-serve-static-core").Router;
export default router;
