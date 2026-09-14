export declare const sendEmail: ({ to, subject, html, }: {
    to: string;
    subject: string;
    html: string;
}) => Promise<void>;
export declare const emailTemplates: {
    listingVerified: (sellerName: string, brand: string) => {
        subject: string;
        html: string;
    };
    listingRejected: (sellerName: string, brand: string, reason: string) => {
        subject: string;
        html: string;
    };
    voucherDelivered: (buyerName: string, brand: string, code: string) => {
        subject: string;
        html: string;
    };
    escrowReleased: (sellerName: string, brand: string, amount: number) => {
        subject: string;
        html: string;
    };
};
