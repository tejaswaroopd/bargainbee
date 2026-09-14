/**
 * Admin Routes
 *
 * FEATURE 4 — Fraud Detection:
 *   GET /api/admin/flagged-sellers returns sellers flagged for duplicate submissions.
 *
 * FEATURE 7 — Secure Transaction Records:
 *   Listing verification and dispute resolution are logged as immutable AuditLog entries.
 *
 * All routes are protected by authenticate + requireAdmin middleware (set at router level).
 */
declare const router: import("express-serve-static-core").Router;
export default router;
