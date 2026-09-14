import { Router, Request, Response } from 'express';
import prisma from '../config/prisma';
import { verifyWebhookSignature } from '../services/razorpayService';

const router = Router();

// POST /api/webhooks/razorpay - Razorpay webhook listener
router.post('/razorpay', async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const body = req.body.toString();

  if (!verifyWebhookSignature(body, signature)) {
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
        await prisma.order.updateMany({
          where: { razorpayOrderId: orderId },
          data: { razorpayPaymentId: paymentId, paymentCapturedAt: new Date() },
        });
      }
    }
  } catch (err) {
    console.error('[Webhook Parse Error]', err);
  }

  res.json({ received: true });
});

export default router;
