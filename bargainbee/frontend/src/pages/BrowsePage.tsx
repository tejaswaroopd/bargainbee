import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { fetchListings, ListingsFilter } from '../api/listings';
import { VoucherCard } from '../components/VoucherCard';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { VoucherListing } from '../types';
import { CATEGORY_ICONS } from '../utils';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'FASHION', label: '👗 Fashion' },
  { value: 'ELECTRONICS', label: '📱 Electronics' },
  { value: 'FOOD_DINING', label: '🍽️ Food & Dining' },
  { value: 'LIFESTYLE', label: '✨ Lifestyle' },
  { value: 'TRAVEL', label: '✈️ Travel' },
  { value: 'ENTERTAINMENT', label: '🎬 Entertainment' },
  { value: 'HEALTH_BEAUTY', label: '💆 Health & Beauty' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Latest' },
  { value: 'discount', label: 'Most Discount' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'expiry', label: 'Expiring Soon' },
];

export default function BrowsePage() {
  const [filters, setFilters] = useState<ListingsFilter>({
    page: 1,
    limit: 12,
    sort: 'createdAt',
  });
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => fetchListings(filters),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 12, sort: 'createdAt' });
    setSearch('');
  };

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-bee-black">Browse Vouchers</h1>
        <p className="text-bee-gray mt-1">
          {data?.pagination?.total || 0} verified vouchers available
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by brand, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button type="submit" variant="primary">Search</Button>
        <Button
          type="button"
          variant="secondary"
          icon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
      </form>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilters((f) => ({ ...f, category: cat.value || undefined, page: 1 }))}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filters.category === cat.value || (!filters.category && !cat.value)
                ? 'bg-bee-yellow border-bee-yellow text-bee-black'
                : 'bg-white border-gray-200 text-bee-gray hover:border-bee-yellow'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="card p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Input
            label="Min Price (₹)"
            type="number"
            placeholder="0"
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
          />
          <Input
            label="Max Price (₹)"
            type="number"
            placeholder="10000"
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined }))}
          />
          <Input
            label="Min Discount (%)"
            type="number"
            placeholder="0"
            onChange={(e) => setFilters((f) => ({ ...f, minDiscount: e.target.value ? parseFloat(e.target.value) : undefined }))}
          />
          <Select
            label="Sort By"
            value={filters.sort || 'createdAt'}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            options={SORT_OPTIONS}
          />
          <div className="sm:col-span-2 md:col-span-4 flex gap-2">
            <Button variant="primary" onClick={() => setFilters((f) => ({ ...f, page: 1 }))}>Apply Filters</Button>
            <Button variant="ghost" icon={<X className="w-4 h-4" />} onClick={clearFilters}>Clear</Button>
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <PageLoader />
      ) : data?.listings?.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-xl font-semibold text-bee-black">No vouchers found</h3>
          <p className="text-bee-gray mt-2">Try adjusting your filters or search terms</p>
          <Button className="mt-4" onClick={clearFilters}>Clear Filters</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {data?.listings?.map((listing: VoucherListing) => (
              <VoucherCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="secondary"
                disabled={filters.page === 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-bee-gray">
                Page {filters.page} of {data.pagination.pages}
              </span>
              <Button
                variant="secondary"
                disabled={filters.page === data.pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
