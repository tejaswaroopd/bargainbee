/**
 * FEATURE 7 — Secure Transaction Records
 *
 * Append-only audit logging service. Every escrow state transition and
 * critical admin action is recorded as an immutable timestamped entry.
 *
 * Design guarantees:
 *   - logAudit() only ever calls prisma.auditLog.create() — never update/delete
 *   - The AuditLog model has no updatedAt field (enforced at schema level)
 *   - Errors are caught and logged but never thrown, so a failed audit
 *     write never rolls back a successful business transaction
 */
export type AuditAction = 'ORDER_CREATED' | 'PAYMENT_CAPTURED' | 'CODE_REVEALED' | 'REDEEMED' | 'ESCROW_RELEASED' | 'ESCROW_REFUNDED' | 'DISPUTE_RAISED' | 'LISTING_VERIFIED' | 'LISTING_REJECTED' | 'EMAIL_VERIFIED' | 'LOGIN_FAILED' | 'SELLER_FLAGGED';
export interface AuditEntry {
    userId: string;
    action: AuditAction;
    orderId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
}
/**
 * Write an immutable audit log entry. Fire-and-forget — never throws.
 * Call this after every escrow state change, verification action, or security event.
 */
export declare function logAudit(entry: AuditEntry): Promise<void>;
/**
 * Retrieve the full audit trail for a given order.
 * Used by GET /api/orders/:id/audit-log (accessible to buyer, seller, admin only).
 */
export declare function getOrderAuditLog(orderId: string): Promise<{
    id: string;
    createdAt: Date;
    action: string;
    metadata: import("@prisma/client/runtime/library").JsonValue;
    ipAddress: string | null;
    userId: string;
}[]>;
