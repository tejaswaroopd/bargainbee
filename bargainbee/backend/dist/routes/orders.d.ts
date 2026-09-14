/**
 * Orders Routes
 *
 * FEATURE 2 — Encrypted Transactions:
 *   Decrypts voucherCode only at reveal time (verify-payment endpoint).
 *
 * FEATURE 5 — Privacy Protection:
 *   Cross-party PII (email, full name) is masked until escrow is RELEASED.
 *   Only masked name ("Priya S.") and avatar are shown before completion.
 *
 * FEATURE 7 — Secure Transaction Records:
 *   Every escrow state transition logs an immutable AuditLog entry.
 *
 * FEATURE 8 — One-Time Redemption Protection:
 *   On first code reveal (verify-payment), isCodeRevealed is flipped to true.
 *   Subsequent fetches check this flag and only return the code to the original buyer.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
