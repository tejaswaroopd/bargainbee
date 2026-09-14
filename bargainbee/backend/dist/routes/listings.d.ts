/**
 * Listings Routes
 *
 * FEATURE 2 — Encrypted Transactions:
 *   Voucher codes are AES-256-GCM encrypted before storage and never returned in plaintext.
 *
 * FEATURE 3 — Digital Voucher Verification:
 *   All new listings are forced to PENDING status; admin must approve before going LIVE.
 *   Admin receives a notification for every new submission.
 *
 * FEATURE 4 — Fraud Detection:
 *   SHA-256 hash of the raw code is stored separately for duplicate detection.
 *   Duplicate attempts increment seller flaggedCount; >= 2 flags seller for admin review.
 *
 * FEATURE 5 — Privacy Protection:
 *   Seller PII (email) is never included in public browse or listing-detail responses.
 *   Only non-sensitive fields (masked name, repScore, isVerified) are exposed.
 *
 * FEATURE 6 — Seller Verification:
 *   requireSellerVerified middleware blocks unverified accounts from creating listings.
 */
declare const router: import("express-serve-static-core").Router;
export default router;
