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

import prisma from '../config/prisma';

export type AuditAction =
  | 'ORDER_CREATED'
  | 'PAYMENT_CAPTURED'
  | 'CODE_REVEALED'
  | 'REDEEMED'
  | 'ESCROW_RELEASED'
  | 'ESCROW_REFUNDED'
  | 'DISPUTE_RAISED'
  | 'LISTING_VERIFIED'
  | 'LISTING_REJECTED'
  | 'EMAIL_VERIFIED'
  | 'LOGIN_FAILED'
  | 'SELLER_FLAGGED';

export interface AuditEntry {
  userId: string;       // who performed / who is affected
  action: AuditAction;
  orderId?: string;     // linked order (if applicable)
  metadata?: Record<string, unknown>;  // freeform context (brand, amount, reason...)
  ipAddress?: string;
}

/**
 * Write an immutable audit log entry. Fire-and-forget — never throws.
 * Call this after every escrow state change, verification action, or security event.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId:    entry.userId,
        action:    entry.action,
        orderId:   entry.orderId   ?? null,
        metadata:  (entry.metadata as any) ?? {},
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Audit write failure must never disrupt the core transaction
    console.error('[AuditLog] Failed to write audit entry:', entry.action, err);
  }
}

/**
 * Retrieve the full audit trail for a given order.
 * Used by GET /api/orders/:id/audit-log (accessible to buyer, seller, admin only).
 */
export async function getOrderAuditLog(orderId: string) {
  return prisma.auditLog.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      action: true,
      metadata: true,
      ipAddress: true,
      createdAt: true,
      userId: true,
    },
  });
}
