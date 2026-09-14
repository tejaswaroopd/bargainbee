import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle2, AlertTriangle, Copy, Check, Star, ArrowLeft, Lock } from 'lucide-react';
import { fetchOrder, confirmOrder, raiseDispute } from '../api/orders';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { formatCurrency, formatDate } from '../utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Voucher code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReceipt = async () => {
    setConfirming(true);
    try {
      await confirmOrder(id!);
      toast.success('🎉 Voucher confirmed! Payment released from escrow to seller.');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      setReviewModalOpen(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Confirmation failed';
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await raiseDispute(id!, { reason: disputeReason, evidence: disputeEvidence });
      toast.success('Dispute submitted. BargainBee admin mediation initiated.');
      setDisputeModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to submit dispute';
      toast.error(msg);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reviews', { orderId: id, rating, comment: reviewComment });
      toast.success('Thank you for rating your seller!');
      setReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Review submission failed';
      toast.error(msg);
    }
  };

  if (isLoading || !data) return <PageLoader />;

  const { order, voucherCode } = data;
  const isBuyer = user?.id === order.buyerId;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <Link to="/dashboard/buyer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-bee-gray hover:text-bee-black">
        <ArrowLeft className="w-4 h-4" /> Back to Purchases
      </Link>

      {/* Main Order Card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs text-bee-gray uppercase tracking-wider font-semibold">Order #{order.id.slice(0, 8)}</span>
            <h1 className="text-2xl font-black text-bee-black mt-0.5">{order.listing?.brand} Voucher</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-bee-gray block">Amount Paid</span>
            <span className="text-xl font-extrabold text-bee-black">{formatCurrency(order.amount)}</span>
          </div>
        </div>

        {/* Escrow Status Banner */}
        <div className={`mt-6 p-4 rounded-card border flex items-center justify-between gap-4 ${
          order.escrowStatus === 'RELEASED'
            ? 'bg-green-50 border-green-200 text-green-800'
            : order.escrowStatus === 'REFUNDED'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {order.escrowStatus === 'RELEASED'
                  ? 'Escrow Settlement Completed'
                  : order.escrowStatus === 'REFUNDED'
                  ? 'Order Refunded'
                  : 'Funds Held Securely in Escrow'}
              </p>
              <p className="text-xs mt-0.5 opacity-90">
                {order.escrowStatus === 'RELEASED'
                  ? 'Redemption confirmed. Funds released to seller.'
                  : order.escrowStatus === 'REFUNDED'
                  ? 'Funds refunded back to your account.'
                  : 'Seller receives payment only after you test the code and confirm redemption.'}
              </p>
            </div>
          </div>
        </div>

        {/* Revealed Secret Voucher Code */}
        {voucherCode && (
          <div className="mt-6 p-6 bg-gradient-to-br from-bee-yellow-light/60 to-white border-2 border-bee-yellow rounded-card text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-bee-gray">Your Digital Voucher Code</span>
            <div className="mt-2 text-2xl sm:text-3xl font-mono font-black text-bee-black tracking-widest select-all">
              {voucherCode}
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <Button
                size="sm"
                variant="dark"
                icon={copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                onClick={() => handleCopyCode(voucherCode)}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
            <p className="text-xs text-bee-gray mt-3">
              Use this code during checkout on the brand store or app.
            </p>
          </div>
        )}

        {/* Buyer Escrow Action Buttons */}
        {isBuyer && order.escrowStatus === 'HELD' && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm text-bee-black">Did the code work?</p>
              <p className="text-xs text-bee-gray mt-0.5">
                Confirm receipt to release escrow payment to the seller.
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setDisputeModalOpen(true)}
              >
                Report Issue / Dispute
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={confirming}
                onClick={handleConfirmReceipt}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Received
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dispute Modal */}
      <Modal open={disputeModalOpen} onClose={() => setDisputeModalOpen(false)} title="Report an Issue & Freeze Escrow">
        <form onSubmit={handleRaiseDispute} className="space-y-4">
          <p className="text-xs text-bee-gray leading-relaxed">
            Raising a dispute freezes escrow payout. Our support and mediation team will investigate the balance and issue a full refund if the voucher is invalid.
          </p>
          <div>
            <label className="block text-xs font-bold text-bee-black mb-1">Reason for Dispute *</label>
            <textarea
              rows={3}
              required
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g. Code invalid, balance already redeemed, expired before indicated date..."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-bee-black mb-1">Evidence / Screenshot Link</label>
            <input
              type="text"
              value={disputeEvidence}
              onChange={(e) => setDisputeEvidence(e.target.value)}
              placeholder="Link to screenshot or error message"
              className="input-field"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setDisputeModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" type="submit">Submit Dispute</Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Leave Seller Review">
        <form onSubmit={handlePostReview} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-bee-black mb-2">Rating (1 to 5 Stars)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-2xl focus:outline-none"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-bee-yellow text-bee-yellow' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-bee-black mb-1">Your Feedback</label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share how fast the voucher worked and your experience..."
              className="input-field"
            />
          </div>
          <Button variant="primary" className="w-full" type="submit">Submit Review</Button>
        </form>
      </Modal>
    </div>
  );
}
