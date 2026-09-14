import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ShieldCheck, Clock, TrendingDown, Star, MessageSquare, AlertTriangle, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { fetchListing } from '../api/listings';
import { createOrder, verifyPayment } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryUrgency, CATEGORY_ICONS } from '../utils';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import api from '../api/client';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListing(id!),
    enabled: !!id,
  });

  const handleStartChat = async () => {
    if (!user) {
      toast.info('Please log in to chat with the seller');
      navigate('/auth/login');
      return;
    }
    setChatLoading(true);
    try {
      const { data } = await api.post('/chat/rooms', { listingId: listing?.id });
      navigate(`/chat/${data.room.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Unable to start chat';
      toast.error(msg);
    } finally {
      setChatLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.info('Please sign in or register to buy vouchers');
      navigate('/auth/login');
      return;
    }
    setPurchasing(true);
    try {
      const result = await createOrder(listing!.id);
      const order = result.order;

      // Simulate instant payment verification for testing/demo mode
      const paymentResult = await verifyPayment(order.id, {
        razorpayPaymentId: `pay_demo_${Date.now()}`,
        razorpaySignature: 'sig_verified_demo',
      });

      toast.success('🎉 Purchase successful! Escrow funds held securely.');
      setCheckoutModalOpen(false);
      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to complete order';
      toast.error(msg);
    } finally {
      setPurchasing(false);
    }
  };

  if (isLoading || !listing) return <PageLoader />;

  const daysLeft = getDaysUntilExpiry(listing.expiryDate);
  const urgency = getExpiryUrgency(listing.expiryDate);
  const savings = listing.faceValue - listing.askingPrice;

  return (
    <div className="page-container py-8 max-w-5xl">
      <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-bee-gray hover:text-bee-black mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-bee-gray">
                {CATEGORY_ICONS[listing.category]} {listing.category.replace(/_/g, ' ')}
              </span>
              <StatusBadge status={listing.status} />
            </div>

            <h1 className="text-3xl font-extrabold text-bee-black">
              {listing.brand} Voucher
            </h1>

            {listing.description && (
              <p className="text-bee-gray text-sm sm:text-base mt-4 leading-relaxed">
                {listing.description}
              </p>
            )}

            {/* Price banner */}
            <div className="mt-6 p-4 sm:p-6 bg-bee-yellow-light/40 border border-bee-yellow rounded-card flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs text-bee-gray font-medium uppercase">Asking Price</span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl font-black text-bee-black">
                    {formatCurrency(listing.askingPrice)}
                  </span>
                  <span className="text-base text-bee-gray line-through">
                    {formatCurrency(listing.faceValue)}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 bg-bee-black text-white text-xs font-bold px-3 py-1 rounded-full">
                  <TrendingDown className="w-3.5 h-3.5 text-bee-yellow" />
                  Save {listing.discountPct}% ({formatCurrency(savings)})
                </span>
              </div>
            </div>

            {/* Key verification specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 text-sm">
              <div>
                <span className="text-xs text-bee-gray">Face Value</span>
                <p className="font-bold text-bee-black mt-0.5">{formatCurrency(listing.faceValue)}</p>
              </div>
              <div>
                <span className="text-xs text-bee-gray">Expiry Date</span>
                <p className="font-bold text-bee-black mt-0.5">{formatDate(listing.expiryDate)}</p>
              </div>
              <div>
                <span className="text-xs text-bee-gray">Urgency</span>
                <p className={`font-bold mt-0.5 ${urgency === 'urgent' ? 'text-red-500' : 'text-bee-black'}`}>
                  {daysLeft <= 0 ? 'Expired' : `${daysLeft} days remaining`}
                </p>
              </div>
            </div>

            {/* Voucher image preview if any */}
            {listing.voucherImageUrl && (
              <div className="mt-6">
                <span className="text-xs text-bee-gray block mb-2 font-medium">Listing Snapshot</span>
                <img
                  src={listing.voucherImageUrl}
                  alt={listing.brand}
                  className="rounded-card border border-gray-200 max-h-64 object-cover w-full"
                />
              </div>
            )}
          </div>

          {/* Escrow Guarantee Box */}
          <div className="card p-6 bg-white border-l-4 border-l-green-500">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-bee-black">Protected by BargainBee Escrow</h3>
                <p className="text-xs text-bee-gray mt-1 leading-relaxed">
                  Your funds are held securely. You will receive the voucher code immediately, and the seller will only be paid once you confirm successful redemption.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Seller Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="card p-6 border-2 border-bee-yellow">
            <div className="text-center mb-6">
              <span className="text-xs text-bee-gray">Total to pay</span>
              <p className="text-3xl font-black text-bee-black mt-1">
                {formatCurrency(listing.askingPrice)}
              </p>
              <p className="text-xs text-green-600 font-semibold mt-1">
                Instant delivery of digital voucher code
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full text-base font-bold shadow-sm"
              onClick={() => setCheckoutModalOpen(true)}
              disabled={listing.status !== 'LIVE'}
              icon={<Lock className="w-4 h-4" />}
            >
              {listing.status === 'LIVE' ? 'Buy with Escrow Hold' : 'Unavailable'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full mt-3"
              onClick={handleStartChat}
              loading={chatLoading}
              icon={<MessageSquare className="w-4 h-4" />}
            >
              Chat with Seller
            </Button>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-bee-gray">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>Zero hidden buyer fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>UPI, Cards, & Netbanking accepted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>Full refund guarantee if code is invalid</span>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          {listing.seller && (
            <div className="card p-6">
              <span className="text-xs font-semibold text-bee-gray uppercase tracking-wider block mb-3">
                Verified Seller
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-bee-yellow flex items-center justify-center font-bold text-lg text-bee-black">
                  {listing.seller.name?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <Link
                    to={`/profile/${listing.seller.id}`}
                    className="font-bold text-bee-black hover:underline"
                  >
                    {listing.seller.name}
                  </Link>
                  <div className="flex items-center gap-1 text-xs text-bee-gray mt-0.5">
                    <Star className="w-3 h-3 fill-bee-yellow text-bee-yellow" />
                    <span className="font-semibold text-bee-black">{listing.seller.repScore?.toFixed(1)}</span>
                    <span>• {listing.seller.totalSales || 0} completed sales</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Escrow Confirmation Modal */}
      <Modal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Confirm Escrow Checkout"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-bee-surface p-4 rounded-card border border-gray-200">
            <div className="flex justify-between text-sm py-1">
              <span className="text-bee-gray">Brand</span>
              <span className="font-bold text-bee-black">{listing.brand}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-bee-gray">Face Value</span>
              <span className="text-bee-black">{formatCurrency(listing.faceValue)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-bee-gray">Discount</span>
              <span className="font-semibold text-green-600">-{listing.discountPct}%</span>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between text-base font-bold">
              <span>Total Payable</span>
              <span className="text-bee-black">{formatCurrency(listing.askingPrice)}</span>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-input text-xs text-yellow-800 flex items-start gap-2">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-yellow-700" />
            <span>
              Your payment of {formatCurrency(listing.askingPrice)} will be placed in an Escrow holding state. The voucher code is revealed immediately. The seller will only receive funds when you confirm redemption.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setCheckoutModalOpen(false)}
              disabled={purchasing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleBuyNow}
              loading={purchasing}
            >
              Pay & Reveal Code
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
