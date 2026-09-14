import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, Clock, ExternalLink, AlertCircle, Zap } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { toast } from '../store/toastStore';
import api from '../api/client';
import { VoucherListing } from '../types';

export default function AdminVerificationQueuePage() {
  const queryClient = useQueryClient();
  const [activeListing, setActiveListing] = useState<VoucherListing | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-queue'],
    queryFn: async () => {
      const { data } = await api.get('/admin/queue');
      return data;
    },
  });

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      await api.put(`/admin/listings/${id}/verify`, { action: 'APPROVE' });
      toast.success('Listing verified! Status set to LIVE.');
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Verification failed';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeListing) return;
    setProcessing(true);
    try {
      await api.put(`/admin/listings/${activeListing.id}/verify`, {
        action: 'REJECT',
        notes: rejectReason,
      });
      toast.info('Listing rejected and seller notified with feedback.');
      setRejectModalOpen(false);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Rejection failed';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) return <PageLoader />;

  const listings = data?.listings || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-bee-black">Verification Queue</h1>
          <p className="text-bee-gray text-sm mt-1">
            24-Hour SLA Target Checklist: Balance authenticity, expiration date, and non-duplicate code confirmation.
          </p>
        </div>
        <Badge variant="yellow" className="text-sm px-3 py-1 font-bold">
          {listings.length} Pending Verifications
        </Badge>
      </div>

      {listings.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h3 className="font-bold text-xl text-bee-black">Queue is Clear!</h3>
          <p className="text-bee-gray text-sm mt-1">
            All submitted vouchers have been screened and verified within the 24-hour target SLA.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l: VoucherListing) => (
            <div
              key={l.id}
              className={`card p-6 border-l-4 transition-shadow hover:shadow-card-hover ${
                l.isPriorityVerification ? 'border-l-bee-yellow bg-bee-yellow-light/20' : 'border-l-blue-500'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Information */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-bee-black">{l.brand} Voucher</span>
                    <span className="text-xs text-bee-gray">• {l.category}</span>
                    {l.isPriorityVerification && (
                      <span className="bg-bee-yellow text-bee-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Priority Fast-Track (6h SLA)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-bee-gray mt-3">
                    <div>
                      <span className="block font-medium">Face Value:</span>
                      <span className="font-bold text-bee-black text-sm">{formatCurrency(l.faceValue)}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Asking Price:</span>
                      <span className="font-bold text-bee-black text-sm">{formatCurrency(l.askingPrice)} (-{l.discountPct}%)</span>
                    </div>
                    <div>
                      <span className="block font-medium">Expiry:</span>
                      <span className="font-bold text-bee-black text-sm">{formatDate(l.expiryDate)}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Seller:</span>
                      <span className="font-bold text-bee-black text-sm">{l.seller?.name || 'Seller'}</span>
                    </div>
                  </div>

                  {l.description && (
                    <p className="text-xs text-bee-gray mt-2 italic">"{l.description}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={processing}
                    onClick={() => {
                      setActiveListing(l);
                      setRejectModalOpen(true);
                    }}
                    icon={<X className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={processing}
                    onClick={() => handleApprove(l.id)}
                    icon={<Check className="w-4 h-4" />}
                  >
                    Approve & Publish Live
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <Modal open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Listing">
        <form onSubmit={handleReject} className="space-y-4">
          <p className="text-xs text-bee-gray">
            Please provide a specific reason for rejecting this listing. The seller will be notified so they can correct and resubmit.
          </p>
          <textarea
            rows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Screenshot unreadable, balance could not be verified on brand portal, expiry too close..."
            className="input-field"
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" type="submit" loading={processing}>Confirm Rejection</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
