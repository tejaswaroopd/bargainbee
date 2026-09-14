"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendEmail = async ({ to, subject, html, }) => {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your@gmail.com') {
        console.log(`[Email Simulation] To: ${to} | Subject: "${subject}"`);
        return;
    }
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'BargainBee <noreply@bargainbee.in>',
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error('[Email Error]', err);
    }
};
exports.sendEmail = sendEmail;
exports.emailTemplates = {
    listingVerified: (sellerName, brand) => ({
        subject: `✅ Your ${brand} voucher is now LIVE on BargainBee!`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A1A1A;">Great news, ${sellerName}!</h2>
        <p>Your <strong>${brand}</strong> voucher listing has passed verification checklist and is now live on BargainBee marketplace.</p>
        <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/seller" style="display:inline-block; background:#F5C518; color:#1A1A1A; padding:10px 20px; font-weight:bold; text-decoration:none; border-radius:6px;">View Seller Dashboard →</a></p>
      </div>
    `,
    }),
    listingRejected: (sellerName, brand, reason) => ({
        subject: `⚠️ Notice regarding your ${brand} listing`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A1A1A;">Hi ${sellerName},</h2>
        <p>Your <strong>${brand}</strong> voucher listing could not be verified by our compliance team.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can edit and resubmit your listing from your dashboard.</p>
      </div>
    `,
    }),
    voucherDelivered: (buyerName, brand, code) => ({
        subject: `🎁 Your ${brand} voucher code is ready!`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A1A1A;">Hi ${buyerName}!</h2>
        <p>Your payment is safely held in escrow. Here is your digital voucher code for <strong>${brand}</strong>:</p>
        <div style="background:#FFF9D2; border:2px dashed #F5C518; padding:20px; font-size:24px; font-weight:bold; letter-spacing:4px; text-align:center; border-radius:8px; margin:20px 0; color:#1A1A1A;">
          ${code}
        </div>
        <p>Once you verify or redeem the code, please click <strong>"Confirm Received"</strong> in your orders dashboard to release funds to the seller.</p>
      </div>
    `,
    }),
    escrowReleased: (sellerName, brand, amount) => ({
        subject: `💰 Payment Released: ₹${amount} for ${brand} voucher`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1A1A1A;">Hi ${sellerName}!</h2>
        <p>The buyer has confirmed successful redemption of your <strong>${brand}</strong> voucher.</p>
        <p><strong>₹${amount}</strong> has been released from escrow into your payout balance.</p>
      </div>
    `,
    }),
};
//# sourceMappingURL=emailService.js.map