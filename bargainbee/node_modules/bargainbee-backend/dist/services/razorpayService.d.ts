export declare const createRazorpayOrder: (amount: number, currency: string | undefined, receipt: string) => Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder | {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
}>;
export declare const verifyPaymentSignature: (orderId: string, paymentId: string, signature: string) => boolean;
export declare const verifyWebhookSignature: (body: string, signature: string) => boolean;
