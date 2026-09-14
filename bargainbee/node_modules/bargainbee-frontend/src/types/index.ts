export type UserRole = 'BUYER' | 'SELLER' | 'BOTH' | 'ADMIN';
export type ListingStatus = 'DRAFT' | 'PENDING' | 'VERIFIED' | 'LIVE' | 'SOLD' | 'EXPIRED' | 'REJECTED';
export type EscrowStatus = 'HELD' | 'RELEASED' | 'REFUNDED';
export type DisputeStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
export type Category = 'FASHION' | 'ELECTRONICS' | 'FOOD_DINING' | 'LIFESTYLE' | 'TRAVEL' | 'ENTERTAINMENT' | 'HEALTH_BEAUTY' | 'GROCERY';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  repScore: number;
  totalSales: number;
  totalPurchases: number;
  referralCode?: string;
  isVerified: boolean;
  sellerVerifiedAt?: string;
  flaggedForReview?: boolean;
  flaggedCount?: number;
  createdAt: string;
}

export interface VoucherListing {
  id: string;
  sellerId: string;
  seller?: Partial<User>;
  brand: string;
  category: Category;
  faceValue: number;
  askingPrice: number;
  discountPct: number;
  expiryDate: string;
  description?: string;
  voucherCode?: string;
  voucherCodeHash?: string;
  voucherImageUrl?: string;
  status: ListingStatus;
  verificationNotes?: string;
  isFeatured: boolean;
  isPriorityVerification?: boolean;
  isCodeRevealed?: boolean;
  codeRevealedAt?: string;
  viewCount: number;
  tags: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  orderId?: string;
  userId: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  listingId: string;
  listing?: Partial<VoucherListing>;
  buyerId: string;
  buyer?: Partial<User>;
  sellerId: string;
  seller?: Partial<User>;
  amount: number;
  commission: number;
  sellerEarnings: number;
  escrowStatus: EscrowStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentCapturedAt?: string;
  confirmedAt?: string;
  createdAt: string;
  review?: Review;
  dispute?: Partial<Dispute>;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewer?: Partial<User>;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  reason: string;
  status: DisputeStatus;
  resolution?: string;
  createdAt: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  brand?: string;
  category?: Category;
  maxPrice?: number;
  notifyEmail: boolean;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  listingId: string;
  listing?: Partial<VoucherListing>;
  buyerId: string;
  buyer?: Partial<User>;
  sellerId: string;
  seller?: Partial<User>;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  sender?: Partial<User>;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
