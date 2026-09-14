import { useNavigate } from 'react-router-dom';
import { Clock, Star, TrendingDown } from 'lucide-react';
import { VoucherListing } from '../types';
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryUrgency, CATEGORY_ICONS, cn } from '../utils';
import { Badge } from './ui/Badge';

interface VoucherCardProps {
  listing: VoucherListing;
}

export function VoucherCard({ listing }: VoucherCardProps) {
  const navigate = useNavigate();
  const daysLeft = getDaysUntilExpiry(listing.expiryDate);
  const urgency = getExpiryUrgency(listing.expiryDate);

  const urgencyColors = {
    safe: 'text-gray-400',
    warning: 'text-orange-500',
    urgent: 'text-red-500 expiry-urgent',
  };

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="card hover:shadow-card-hover transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      {/* Image or brand banner */}
      <div className="relative h-36 bg-gradient-to-br from-bee-yellow-light to-bee-yellow rounded-t-card -m-5 mb-0 flex items-center justify-center">
        {listing.voucherImageUrl ? (
          <img
            src={listing.voucherImageUrl}
            alt={listing.brand}
            className="w-full h-full object-cover rounded-t-card"
          />
        ) : (
          <div className="text-center">
            <span className="text-4xl">{CATEGORY_ICONS[listing.category] || '🎫'}</span>
            <p className="text-bee-black font-bold text-lg mt-1">{listing.brand}</p>
          </div>
        )}

        {listing.isFeatured && (
          <div className="absolute top-2 left-2">
            <Badge variant="yellow">⭐ Featured</Badge>
          </div>
        )}

        {/* Discount badge */}
        <div className="absolute top-2 right-2 bg-bee-black text-white text-sm font-bold px-2.5 py-1 rounded-full">
          -{listing.discountPct}%
        </div>
      </div>

      <div className="pt-4">
        {/* Brand + Category */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-bee-black group-hover:text-bee-yellow-dark transition-colors">
              {listing.brand}
            </h3>
            <p className="text-xs text-bee-gray mt-0.5">
              {CATEGORY_ICONS[listing.category]} {listing.category.replace(/_/g, ' ')}
            </p>
          </div>
          {listing.seller && (
            <div className="flex items-center gap-1 text-xs text-bee-gray shrink-0">
              <Star className="w-3 h-3 fill-bee-yellow text-bee-yellow" />
              {listing.seller.repScore?.toFixed(1)}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-xl font-bold text-bee-black">
            {formatCurrency(listing.askingPrice)}
          </span>
          <span className="text-sm text-bee-gray line-through">
            {formatCurrency(listing.faceValue)}
          </span>
          <span className="ml-auto">
            <TrendingDown className="w-4 h-4 text-green-500 inline" />
            <span className="text-green-600 text-sm font-medium">
              Save {formatCurrency(listing.faceValue - listing.askingPrice)}
            </span>
          </span>
        </div>

        {/* Expiry */}
        <div className={cn('flex items-center gap-1 mt-2 text-xs', urgencyColors[urgency])}>
          <Clock className="w-3 h-3" />
          <span>
            {daysLeft <= 0
              ? 'Expired'
              : daysLeft === 1
              ? 'Expires tomorrow!'
              : urgency === 'urgent'
              ? `Only ${daysLeft} days left!`
              : `Expires ${formatDate(listing.expiryDate)}`}
          </span>
        </div>

        {/* FEATURE 6: Show Verified Seller badge ONLY when seller is verified */}
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          {listing.seller?.isVerified ? (
            <Badge variant="verified">🛡️ Verified Seller</Badge>
          ) : (
            <span className="text-xs text-bee-gray font-medium">Standard Seller</span>
          )}
          <span className="text-xs text-bee-gray">{listing.viewCount} views</span>
        </div>
      </div>
    </div>
  );
}
