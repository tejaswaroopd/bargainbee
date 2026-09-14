import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle2, DollarSign, Package, AlertCircle, TrendingUp, ExternalLink } from 'lucide-react';
import { fetchMyListings } from '../api/listings';
import { formatCurrency, formatDate } from '../utils';
import { Button } from '../components/ui/Button';
import { StatsCard } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import api from '../api/client';
import { VoucherListing } from '../types';

export default function SellerDashboardPage() {
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: fetchMyListings,
  });

  const { data: stats } = useQuery({
    queryKey: ['seller-stats'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/stats');
      return data;
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-bee-black">Seller Dashboard</h1>
          <p className="text-bee-gray text-sm mt-1">Track your listings, earnings, and verification status.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/sell')} icon={<Plus className="w-4 h-4" />}>
          List New Voucher
        </Button>
      </div>

      {/* Real-time Earnings & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Earnings (Settled)"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon="💰"
          subtext="Available for instant bank withdrawal"
          accent
        />
        <StatsCard
          label="Active Live Listings"
          value={stats?.activeListings || 0}
          icon="🟢"
          subtext="Visible to nationwide buyers"
        />
        <StatsCard
          label="Completed Orders"
          value={stats?.totalOrders || 0}
          icon="📦"
          subtext="Successfully delivered vouchers"
        />
        <StatsCard
          label="Verification SLA"
          value="< 24 hrs"
          icon="⚡"
          subtext="Target turnaround window"
        />
      </div>

      {/* Listings Status Tracker */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-bee-black">Your Listings Tracker</h2>
          <span className="text-xs text-bee-gray">{listings?.length || 0} total listings</span>
        </div>

        {listings?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎫</p>
            <h3 className="font-bold text-bee-black">No listings yet</h3>
            <p className="text-bee-gray text-sm mt-1">Start selling your unused gift cards in under 2 minutes.</p>
            <Button className="mt-4" onClick={() => navigate('/sell')}>Create Your First Listing</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-bee-gray text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Brand / Category</th>
                  <th className="p-4">Face Value</th>
                  <th className="p-4">Asking Price</th>
                  <th className="p-4">Status & SLA</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings?.map((l: VoucherListing) => (
                  <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-bee-black">{l.brand}</p>
                      <p className="text-xs text-bee-gray">{l.category}</p>
                    </td>
                    <td className="p-4 font-semibold text-gray-500 line-through">
                      {formatCurrency(l.faceValue)}
                    </td>
                    <td className="p-4 font-bold text-bee-black">
                      {formatCurrency(l.askingPrice)}
                      <span className="text-xs text-green-600 ml-1.5 font-medium">(-{l.discountPct}%)</span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <StatusBadge status={l.status} />
                        {l.status === 'PENDING' && (
                          <p className="text-xs text-amber-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In Verification SLA
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-bee-gray text-xs">
                      {formatDate(l.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/listing/${l.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-bee-black hover:underline"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
