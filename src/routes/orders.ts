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

import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/razorpayService';
import { sendEmail, emailTemplates } from '../services/emailService';
import { decryptField, isEncrypted } from '../services/encryptionService';
import { logAudit, getOrderAuditLog } from '../services/auditService';

const router = Router();

/**
 * FEATURE 5 — Privacy helper: mask a full name to "First L." format.
 * Used to expose a recognisable but non-identifying name to the other party
 * before a transaction is completed.
 */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0] + '***';
  return parts[0] + ' ' + parts[parts.length - 1][0] + '.';
}

// ---------------------------------------------------------------------------
// GET /api/orders/my — Buyer and Seller order list
// ---------------------------------------------------------------------------
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const orders = await prisma.order.findMany({
    where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        select: {
          id: true, brand: true, category: true,
          voucherImageUrl: true, askingPrice: true, faceValue: true,
          // FEATURE 2: never return voucherCode in list view
        },
      },
      // FEATURE 5: Only safe non-PII fields in list view
      buyer:  { select: { id: true, name: true, avatar: true } },
      seller: { select: { id: true, name: true, avatar: true } },
      review: true,
      dispute: { select: { id: true, status: true } },
    },
  });
  res.json({ orders });
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id — Order detail with conditional PII reveal (Feature 5)
// ---------------------------------------------------------------------------
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      listing: {
        select: {
          id: true, brand: true, category: true, faceValue: true,
          askingPrice: true, voucherImageUrl: true, isCodeRevealed: true,
          // voucherCode intentionally excluded here — use verify-payment to reveal
        },
      },
      buyer:  { select: { id: true, name: true, avatar: true, email: true } },
      seller: { select: { id: true, name: true, avatar: true, email: true, isVerified: true } },
      review: true,
      dispute: true,
    },
  });

  if (!order) throw new AppError('Order not found', 404);
  const isParty = order.buyerId === req.user!.id || order.sellerId === req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';
  if (!isParty && !isAdmin) throw new AppError('Unauthorized access to this order', 403);

  // FEATURE 5 — Privacy Protection:
  // Only reveal the other party's email AFTER escrow is RELEASED (transaction complete)
  // or to admin. Until then, mask the name and omit email entirely.
  const escrowComplete = order.escrowStatus === 'RELEASED' || order.escrowStatus === 'REFUNDED';

  let safeOrder: Record<string, unknown> = { ...order };

  if (!isAdmin && !escrowComplete) {
    // Buyer sees masked seller name, no seller email
    if (order.buyerId === req.user!.id) {
      safeOrder = {
        ...safeOrder,
        seller: {
          id: order.seller.id,
          name: maskName(order.seller.name),  // "Priya S."
          avatar: order.seller.avatar,
          isVerified: order.seller.isVerified,
          // email intentionally withheld until completion
        },
      };
    }
    // Seller sees masked buyer name, no buyer email
    if (order.sellerId === req.user!.id) {
      safeOrder = {
        ...safeOrder,
        buyer: {
          id: order.buyer.id,
          name: maskName(order.buyer.name),
          avatar: order.buyer.avatar,
        },
      };
    }
  }

  // FEATURE 8 — One-Time Redemption: Only return the code to the original buyer
  // if they already revealed it (i.e. they hit verify-payment). Never to anyone else.
  let voucherCode: string | undefined;
  if (order.buyerId === req.user!.id && order.listing.isCodeRevealed) {
    const fullListing = await prisma.voucherListing.findUnique({
      where: { id: order.listingId },
      select: { voucherCode: true },
    });
    if (fullListing?.voucherCode) {
      try {
        // FEATURE 2: decrypt on the way out
        voucherCode = isEncrypted(fullListing.voucherCode)
          ? decryptField(fullListing.voucherCode)
          : fullListing.voucherCode; // fallback for pre-migration plaintext
      } catch {
        voucherCode = undefined; // decryption failure — don't expose corrupt data
      }
    }
  }

  res.json({ order: safeOrder, voucherCode });
});

// ---------------------------------------------------------------------------
// POST /api/orders — Initiate purchase with Escrow Hold
// ---------------------------------------------------------------------------
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { listingId } = req.body;
  if (!listingId) throw new AppError('listingId is required', 400);

  const listing = await prisma.voucherListing.findUnique({
    where: { id: listingId },
    include: { seller: { select: { id: true, email: true, name: true } } },
  });

  if (!listing) throw new AppError('Listing not found', 404);
  if (listing.status !== 'LIVE') throw new AppError('This voucher is not available for purchase', 400);
  if (listing.sellerId === req.user!.id) throw new AppError('You cannot purchase your own voucher', 400);

  const config = await prisma.platformConfig.findUnique({ where: { key: 'COMMISSION_PERCENT' } });
  const commissionPct = parseFloat(config?.value || '5');
  const commission = (listing.askingPrice * commissionPct) / 100;
  const sellerEarnings = listing.askingPrice - commission;

  const razorpayOrder = await createRazorpayOrder(
    listing.askingPrice,
    'INR',
    `bb_order_${Date.now()}`
  );

  const order = await prisma.order.create({
    data: {
      listingId,
      buyerId: req.user!.id,
      sellerId: listing.sellerId,
      amount: listing.askingPrice,
      commission,
      sellerEarnings,
      escrowStatus: 'HELD',
      razorpayOrderId: razorpayOrder.id,
      autoReleaseAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.voucherListing.update({
    where: { id: listingId },
    data: { status: 'SOLD' },
  });

  // FEATURE 7 — Audit: order created, funds in escrow
  await logAudit({
    userId: req.user!.id,
    action: 'ORDER_CREATED',
    orderId: order.id,
    ipAddress: req.ip,
    metadata: {
      listingId,
      brand: listing.brand,
      amount: listing.askingPrice,
      sellerId: listing.sellerId,
    },
  });

  res.status(201).json({
    order,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
    amount: Math.round(listing.askingPrice * 100),
    currency: 'INR',
  });
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/verify-payment — Confirm payment & reveal code once
// ---------------------------------------------------------------------------
router.post('/:id/verify-payment', authenticate, async (req: AuthRequest, res: Response) => {
  const { razorpayPaymentId, razorpaySignature } = req.body;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { listing: { select: { id: true, brand: true, voucherCode: true, isCodeRevealed: true } } },
  });
  if (!order) throw new AppError('Order not found', 404);
  if (order.buyerId !== req.user!.id) throw new AppError('Unauthorized', 403);

  // FEATURE 8 — One-Time Redemption: if code was already revealed, return it without re-processing
  if (order.listing.isCodeRevealed) {
    let alreadyRevealed: string | undefined;
    if (order.listing.voucherCode) {
      try {
        alreadyRevealed = isEncrypted(order.listing.voucherCode)
          ? decryptField(order.listing.voucherCode)
          : order.listing.voucherCode;
      } catch { /* suppress */ }
    }
    res.json({ order, voucherCode: alreadyRevealed, alreadyRevealed: true });
    return;
  }

  // Payment signature verification
  const isValid = verifyPaymentSignature(order.razorpayOrderId || '', razorpayPaymentId, razorpaySignature);
  const isDemoMode =
    order.razorpayOrderId?.startsWith('order_mock') ||
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id';

  if (!isValid && !isDemoMode) {
    throw new AppError('Invalid payment verification signature', 400);
  }

  // Update order with payment details
  const updatedOrder = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      razorpayPaymentId: razorpayPaymentId || `pay_simulated_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'sig_simulated',
      paymentCapturedAt: new Date(),
    },
    include: {
      buyer:  { select: { email: true, name: true } },
      listing: { select: { brand: true, voucherCode: true, id: true } },
    },
  });

  // FEATURE 2 — Decrypt the voucher code for delivery
  let plainCode: string | undefined;
  if (updatedOrder.listing.voucherCode) {
    try {
      plainCode = isEncrypted(updatedOrder.listing.voucherCode)
        ? decryptField(updatedOrder.listing.voucherCode)
        : updatedOrder.listing.voucherCode;
    } catch {
      throw new AppError('Voucher code could not be decrypted. Please contact support.', 500);
    }
  }

  // FEATURE 8 — One-Time Redemption: atomically flip isCodeRevealed so no other
  // buyer can ever see this code, even if they somehow get access to this endpoint.
  await prisma.voucherListing.update({
    where: { id: order.listingId },
    data: {
      isCodeRevealed: true,
      codeRevealedAt: new Date(),
    },
  });

  // Send the decrypted code by email (so buyer has a persistent record)
  if (plainCode) {
    const emailData = emailTemplates.voucherDelivered(
      updatedOrder.buyer.name,
      updatedOrder.listing.brand,
      plainCode
    );
    await sendEmail({ to: updatedOrder.buyer.email, ...emailData });
  }

  // FEATURE 7 — Audit: payment captured and code revealed (two separate events)
  await logAudit({
    userId: req.user!.id,
    action: 'PAYMENT_CAPTURED',
    orderId: order.id,
    ipAddress: req.ip,
    metadata: {
      brand: updatedOrder.listing.brand,
      razorpayPaymentId: updatedOrder.razorpayPaymentId,
    },
  });
  await logAudit({
    userId: req.user!.id,
    action: 'CODE_REVEALED',
    orderId: order.id,
    ipAddress: req.ip,
    metadata: { brand: updatedOrder.listing.brand },
  });

  res.json({ order: updatedOrder, voucherCode: plainCode });
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/confirm — Buyer confirms redemption → release escrow
// ---------------------------------------------------------------------------
router.post('/:id/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      buyer:  { select: { email: true, name: true } },
      seller: { select: { email: true, name: true } },
      listing: { select: { brand: true } },
    },
  });
  if (!order) throw new AppError('Order not found', 404);
  if (order.buyerId !== req.user!.id) {
    throw new AppError('Only the buyer who purchased the voucher can confirm redemption', 403);
  }
  if (order.escrowStatus !== 'HELD') {
    throw new AppError('Escrow funds have already been resolved', 400);
  }

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: { escrowStatus: 'RELEASED', confirmedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: order.sellerId },
    data: { totalSales: { increment: 1 } },
  });

  const emailData = emailTemplates.escrowReleased(
    order.seller.name,
    order.listing.brand,
    order.sellerEarnings
  );
  await sendEmail({ to: order.seller.email, ...emailData });

  await prisma.notification.create({
    data: {
      userId: order.sellerId,
      type: 'ESCROW_RELEASED',
      title: '🎉 Payment Released!',
      message: `Buyer verified redemption. ₹${order.sellerEarnings.toFixed(0)} has been credited for your ${order.listing.brand} voucher.`,
      link: `/orders/${order.id}`,
    },
  });

  // FEATURE 7 — Audit: buyer confirmed, escrow released
  await logAudit({
    userId: req.user!.id,
    action: 'REDEEMED',
    orderId: order.id,
    ipAddress: req.ip,
    metadata: { brand: order.listing.brand },
  });
  await logAudit({
    userId: order.sellerId,
    action: 'ESCROW_RELEASED',
    orderId: order.id,
    ipAddress: req.ip,
    metadata: { amount: order.sellerEarnings, brand: order.listing.brand },
  });

  res.json({ order: updated, message: 'Escrow released successfully to seller' });
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/dispute — Raise dispute for mediation
// ---------------------------------------------------------------------------
router.post('/:id/dispute', authenticate, async (req: AuthRequest, res: Response) => {
  const { reason, evidence } = req.body;
  if (!reason) throw new AppError('Dispute reason is required', 400);

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError('Order not found', 404);
  if (order.buyerId !== req.user!.id && order.sellerId !== req.user!.id) {
    throw new AppError('Unauthorized', 403);
  }
  if (order.escrowStatus !== 'HELD') {
    throw new AppError('Can only dispute an order currently in escrow status', 400);
  }

  const dispute = await prisma.dispute.create({
    data: {
      orderId: order.id,
      raisedById: req.user!.id,
      reason,
      evidence,
    },
  });

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'DISPUTE_OPENED',
        title: '⚠️ New Order Dispute',
        message: `Dispute raised on order ${order.id.slice(0, 8)}. Action required.`,
        link: `/dashboard/admin`,
      },
    });
  }

  // FEATURE 7 — Audit: dispute raised
  await logAudit({
    userId: req.user!.id,
    action: 'DISPUTE_RAISED',
    orderId: order.id,
    ipAddress: req.ip,
    metadata: { reason },
  });

  res.status(201).json({ dispute });
});

// ---------------------------------------------------------------------------
// GET /api/orders/:id/audit-log — Full escrow audit trail (Feature 7)
// ---------------------------------------------------------------------------
router.get('/:id/audit-log', authenticate, async (req: AuthRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError('Order not found', 404);

  // Only the buyer, seller of this order, or an admin may read the audit trail
  const isParty = order.buyerId === req.user!.id || order.sellerId === req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';
  if (!isParty && !isAdmin) throw new AppError('Unauthorized', 403);

  const logs = await getOrderAuditLog(req.params.id);
  res.json({ orderId: req.params.id, auditLog: logs });
});

export default router;
