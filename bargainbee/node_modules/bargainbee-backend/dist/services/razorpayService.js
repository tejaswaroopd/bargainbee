"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = exports.verifyPaymentSignature = exports.createRazorpayOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_your_key_id') {
        return null; // Dev / mock mode
    }
    return new razorpay_1.default({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};
const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
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
exports.createRazorpayOrder = createRazorpayOrder;
const verifyPaymentSignature = (orderId, paymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto_1.default.createHmac('sha256', secret).update(body).digest('hex');
    return expectedSignature === signature;
};
exports.verifyPaymentSignature = verifyPaymentSignature;
const verifyWebhookSignature = (body, signature) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const expectedSignature = crypto_1.default.createHmac('sha256', secret).update(body).digest('hex');
    return expectedSignature === signature;
};
exports.verifyWebhookSignature = verifyWebhookSignature;
//# sourceMappingURL=razorpayService.js.map