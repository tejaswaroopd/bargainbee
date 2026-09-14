"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.getOrderAuditLog = getOrderAuditLog;
const prisma_1 = __importDefault(require("../config/prisma"));
/**
 * Write an immutable audit log entry. Fire-and-forget — never throws.
 * Call this after every escrow state change, verification action, or security event.
 */
async function logAudit(entry) {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                userId: entry.userId,
                action: entry.action,
                orderId: entry.orderId ?? null,
                metadata: entry.metadata ?? {},
                ipAddress: entry.ipAddress ?? null,
            },
        });
    }
    catch (err) {
        // Audit write failure must never disrupt the core transaction
        console.error('[AuditLog] Failed to write audit entry:', entry.action, err);
    }
}
/**
 * Retrieve the full audit trail for a given order.
 * Used by GET /api/orders/:id/audit-log (accessible to buyer, seller, admin only).
 */
async function getOrderAuditLog(orderId) {
    return prisma_1.default.auditLog.findMany({
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
//# sourceMappingURL=auditService.js.map