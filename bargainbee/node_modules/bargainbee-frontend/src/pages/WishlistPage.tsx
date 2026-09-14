import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import { formatCurrency } from '../utils';
import { toast } from '../store/toastStore';
import api from '../api/client';
import { Wishlist } from '../types';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const [brand, setBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const { data } = await api.get('/wishlist');
      return data.items;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      toast.error('Please specify a brand name');
      return;
    }
    try {
      await api.post('/wishlist', {
        brand: brand.trim(),
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      });
      toast.success(`Alert created for ${brand}! You will be notified when listed.`);
      setBrand('');
      setMaxPrice('');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch {
      toast.error('Failed to create alert');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/wishlist/${id}`);
      toast.info('Alert removed');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch {
      toast.error('Failed to remove alert');
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-bee-black">Wishlist & Price Drop Alerts</h1>
        <p className="text-bee-gray text-sm mt-1">
          Never miss a deal. Tell us what brand you want and we'll notify you the minute it is listed.
        </p>
      </div>

      {/* Add alert form */}
      <form onSubmit={handleCreate} className="card p-6 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <Input
            label="Brand to Monitor"
            placeholder="e.g. Myntra, Apple, Zara, Croma..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            required
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            label="Max Price (₹, optional)"
            type="number"
            placeholder="e.g. 2000"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <Button type="submit" variant="primary" icon={<Bell className="w-4 h-4" />}>
          Set Alert
        </Button>
      </form>

      {/* Existing alerts list */}
      <div className="card divide-y divide-gray-100">
        <div className="p-4 border-b border-gray-100 font-bold text-sm text-bee-black">
          Active Brand Alerts ({wishlist?.length || 0})
        </div>

        {wishlist?.length === 0 ? (
          <div className="p-8 text-center text-sm text-bee-gray">
            No brand alerts set yet. Add one above to get instant notifications when discounted gift cards are listed!
          </div>
        ) : (
          wishlist?.map((item: Wishlist) => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-bee-yellow-light flex items-center justify-center text-bee-black">
                  <Bell className="w-4 h-4 text-bee-black" />
                </div>
                <div>
                  <p className="font-bold text-bee-black">{item.brand}</p>
                  <p className="text-xs text-bee-gray">
                    {item.maxPrice ? `Notify when listed under ${formatCurrency(item.maxPrice)}` : 'Notify on any new listing'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(item.id)}
                icon={<Trash2 className="w-4 h-4 text-red-500" />}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
