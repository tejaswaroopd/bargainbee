import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, ShieldCheck, Calendar, Package } from 'lucide-react';
import { VoucherCard } from '../components/VoucherCard';
import { PageLoader } from '../components/ui/Spinner';
import { formatDate, formatRelativeTime } from '../utils';
import api from '../api/client';
import { VoucherListing, Review } from '../types';

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading } = useQuery({
    queryKey: ['public-profile', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data.user;
    },
    enabled: !!id,
  });

  if (isLoading || !user) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      {/* Seller Header */}
      <div className="card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-full bg-bee-yellow text-bee-black flex items-center justify-center font-extrabold text-3xl shadow-sm">
          {user.name?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-bee-black">{user.name}</h1>
            <span className="badge-verified">
              <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-sm text-bee-gray">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-bee-yellow text-bee-yellow" />
              <span className="font-bold text-bee-black">{user.repScore?.toFixed(1) || '5.0'}</span>
              <span>Reputation</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{user.totalSales || 0} Successful Sales</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Member since {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div>
        <h2 className="text-xl font-bold text-bee-black mb-4">
          Active Listings by {user.name} ({user.listings?.length || 0})
        </h2>
        {user.listings?.length === 0 ? (
          <p className="text-sm text-bee-gray">No active live listings right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {user.listings?.map((l: VoucherListing) => (
              <VoucherCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews & Feedback */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-bee-black mb-4">
          Verified Buyer Reviews ({user.receivedReviews?.length || 0})
        </h2>
        {user.receivedReviews?.length === 0 ? (
          <p className="text-sm text-bee-gray">No reviews received yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {user.receivedReviews?.map((r: Review) => (
              <div key={r.id} className="py-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-bee-black">{r.reviewer?.name || 'Verified Buyer'}</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-bee-yellow text-bee-yellow" />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-xs text-bee-gray mt-1 leading-relaxed">{r.comment}</p>
                )}
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {formatRelativeTime(r.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
