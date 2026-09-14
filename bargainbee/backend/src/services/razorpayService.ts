import Razorpay from 'razorpay';
import crypto from 'crypto';

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id') {
    return null; // Dev / mock mode
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
};

export const createRazorpayOrder = async (amount: number, currency = 'INR', receipt: string) => {
  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    return {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      receipt,
      status: 'created',
    };
  }
  return razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
  });
};

export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const secret = process.env.RAZORPAY_KEY_SECRET || '';
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === signature;
};

export const verifyWebhookSignature = (body: string, signature: string): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expectedSignature === signature;
};
