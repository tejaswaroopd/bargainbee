import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import { fetchMyOrders } from '../api/orders';
import { formatCurrency, formatDate } from '../utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { Order } from '../types';

export default function BuyerDashboardPage() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });

  if (isLoading) return <PageLoader />;

  const escrowBadgeMap: Record<string, { label: string; variant: 'pending' | 'verified' | 'sold' }> = {
    HELD: { label: '🔒 Held in Escrow', variant: 'pending' },
    RELEASED: { label: '✅ Released to Seller', variant: 'verified' },
    REFUNDED: { label: '↩️ Refunded', variant: 'sold' },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-bee-black">My Purchases</h1>
          <p className="text-bee-gray text-sm mt-1">
            Track your purchased voucher codes, escrow protection states, and seller reviews.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/browse')}>
          Explore More Deals
        </Button>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-bee-black">Order History</h2>
          <span className="text-xs text-bee-gray">{orders?.length || 0} orders</span>
        </div>

        {orders?.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🛍️</p>
            <h3 className="font-bold text-bee-black">No orders yet</h3>
            <p className="text-bee-gray text-sm mt-1">Discover verified gift cards with up to 30% discount.</p>
            <Button className="mt-4" onClick={() => navigate('/browse')}>Start Browsing</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-bee-gray text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Amount Paid</th>
                  <th className="p-4">Escrow Status</th>
                  <th className="p-4">Seller</th>
                  <th className="p-4">Order Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders?.map((order: Order) => {
                  const escrowInfo = escrowBadgeMap[order.escrowStatus] || { label: order.escrowStatus, variant: 'pending' as const };
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-bee-black">{order.listing?.brand || 'Voucher'}</p>
                        <p className="text-xs text-bee-gray">{order.listing?.category}</p>
                      </td>
                      <td className="p-4 font-bold text-bee-black">
                        {formatCurrency(order.amount)}
                      </td>
                      <td className="p-4">
                        <Badge variant={escrowInfo.variant}>
                          {escrowInfo.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-bee-black font-medium">
                        {order.seller?.name || 'Seller'}
                      </td>
                      <td className="p-4 text-bee-gray text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-bee-black bg-bee-yellow px-3 py-1.5 rounded-input hover:bg-bee-yellow-dark"
                        >
                          View Voucher Code <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
