import { useQuery } from '@tanstack/react-query';
import { StatsCard } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { formatCurrency } from '../utils';
import api from '../api/client';

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-detailed-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data;
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-bee-black">Platform Economics & Analytics</h1>
        <p className="text-bee-gray text-sm mt-1">
          Monitor Gross Merchandise Value (GMV), platform take rate, escrow float, and category breakdown.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Settled GMV"
          value={formatCurrency(analytics?.gmv || 0)}
          icon="💰"
          accent
        />
        <StatsCard
          label="Take Rate (Commission)"
          value={`${analytics?.takeRate || 5}%`}
          icon="📊"
          subtext="Net platform monetization"
        />
        <StatsCard
          label="Total Vouchers Listed"
          value={analytics?.totalListings || 0}
          icon="🎫"
          subtext="Across all categories"
        />
        <StatsCard
          label="Total Registered Users"
          value={analytics?.totalUsers || 0}
          icon="👥"
          subtext="Buyers and sellers"
        />
      </div>

      {/* Category Performance Matrix */}
      <div className="card p-6">
        <h2 className="font-bold text-lg text-bee-black mb-4">Category Volume & Liquidity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-bee-gray text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Category</th>
                <th className="p-4">Live Listings</th>
                <th className="p-4">Avg. Discount Offered</th>
                <th className="p-4">Avg. Asking Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analytics?.categoryStats?.map((c: { category: string; _count: { id: number }; _avg: { discountPct: number; askingPrice: number } }) => (
                <tr key={c.category} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-bee-black">{c.category.replace(/_/g, ' ')}</td>
                  <td className="p-4 font-semibold text-bee-black">{c._count?.id || 0}</td>
                  <td className="p-4 text-green-600 font-bold">{Math.round(c._avg?.discountPct || 0)}% OFF</td>
                  <td className="p-4 font-medium text-bee-black">{formatCurrency(c._avg?.askingPrice || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
