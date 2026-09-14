"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../config/prisma"));
const razorpayService_1 = require("../services/razorpayService");
const router = (0, express_1.Router)();
// POST /api/webhooks/razorpay - Razorpay webhook listener
router.post('/razorpay', async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body.toString();
    if (!(0, razorpayService_1.verifyWebhookSignature)(body, signature)) {
        res.status(400).json({ error: 'Invalid webhook signature' });
        return;
    }
    try {
        const event = JSON.parse(body);
        const { event: eventType, payload } = event;
        if (eventType === 'payment.captured') {
            const paymentId = payload.payment?.entity?.id;
            const orderId = payload.payment?.entity?.order_id;
            if (orderId && paymentId) {
                await prisma_1.default.order.updateMany({
                    where: { razorpayOrderId: orderId },
                    data: { razorpayPaymentId: paymentId, paymentCapturedAt: new Date() },
                });
            }
        }
    }
    catch (err) {
        console.error('[Webhook Parse Error]', err);
    }
    res.json({ received: true });
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map