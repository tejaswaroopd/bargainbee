import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { createListing } from '../api/listings';
import { toast } from '../store/toastStore';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const CATEGORY_OPTIONS = [
  { value: 'FASHION', label: '👗 Fashion & Apparel' },
  { value: 'ELECTRONICS', label: '📱 Electronics & Appliances' },
  { value: 'FOOD_DINING', label: '🍽️ Food & Dining' },
  { value: 'LIFESTYLE', label: '✨ Lifestyle & Entertainment' },
  { value: 'TRAVEL', label: '✈️ Travel & Hotels' },
  { value: 'ENTERTAINMENT', label: '🎬 Entertainment & Events' },
  { value: 'HEALTH_BEAUTY', label: '💆 Health & Beauty' },
  { value: 'GROCERY', label: '🛒 Grocery & Essentials' },
];

export default function CreateListingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    brand: '',
    category: 'FASHION',
    faceValue: '',
    askingPrice: '',
    expiryDate: '',
    voucherCode: '',
    description: '',
    isPriorityVerification: false,
  });

  const [voucherImage, setVoucherImage] = useState<File | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);

  // Dynamic discount calculation
  const face = parseFloat(form.faceValue) || 0;
  const asking = parseFloat(form.askingPrice) || 0;
  const discountPct = face > 0 && asking > 0 ? Math.round(((face - asking) / face) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent, status: 'PENDING' | 'DRAFT' = 'PENDING') => {
    e.preventDefault();

    if (!form.brand || !form.faceValue || !form.askingPrice || !form.expiryDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (asking >= face) {
      toast.warning('Asking price should be lower than face value for a competitive listing');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('brand', form.brand);
      formData.append('category', form.category);
      formData.append('faceValue', form.faceValue);
      formData.append('askingPrice', form.askingPrice);
      formData.append('expiryDate', form.expiryDate);
      formData.append('voucherCode', form.voucherCode);
      formData.append('description', form.description);
      formData.append('status', status);
      formData.append('isPriorityVerification', String(form.isPriorityVerification));

      if (voucherImage) formData.append('voucherImage', voucherImage);
      if (receipt) formData.append('receipt', receipt);

      await createListing(formData);

      toast.success(
        status === 'DRAFT'
          ? 'Draft saved successfully!'
          : 'Voucher submitted for 24h verification check!'
      );
      navigate('/dashboard/seller');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to submit listing';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-bee-black">List a Voucher for Sale</h1>
        <p className="text-bee-gray text-sm mt-1">
          Turn your unused store credits into liquidity in under 2 minutes.
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'PENDING')} className="space-y-6">
        {/* Step 1: Basic Brand & Category */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg text-bee-black border-b border-gray-100 pb-3">
            1. Brand & Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand Name *"
              placeholder="e.g. Myntra, Apple, Croma, Swiggy"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
            <Select
              label="Category *"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={CATEGORY_OPTIONS}
            />
          </div>
        </div>

        {/* Step 2: Pricing & Expiry */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg text-bee-black border-b border-gray-100 pb-3">
            2. Value & Expiration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Face Value (₹) *"
              type="number"
              placeholder="2000"
              value={form.faceValue}
              onChange={(e) => setForm({ ...form, faceValue: e.target.value })}
              required
            />
            <Input
              label="Your Asking Price (₹) *"
              type="number"
              placeholder="1600"
              value={form.askingPrice}
              onChange={(e) => setForm({ ...form, askingPrice: e.target.value })}
              required
            />
            <Input
              label="Expiry Date *"
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              required
            />
          </div>

          {/* Real-time calculated discount highlight */}
          {discountPct > 0 && (
            <div className="p-3 bg-bee-yellow-light/60 border border-bee-yellow rounded-input text-xs font-semibold text-bee-black flex items-center justify-between">
              <span>⚡ Buyer Discount: <span className="text-green-700 text-sm font-bold">{discountPct}% OFF</span></span>
              <span>Platform Take Rate: 5% (₹{((asking * 5) / 100).toFixed(0)})</span>
              <span className="font-bold">Estimated Payout: ₹{(asking * 0.95).toFixed(0)}</span>
            </div>
          )}
        </div>

        {/* Step 3: Voucher Code & Proof */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-lg text-bee-black border-b border-gray-100 pb-3">
            3. Voucher Code & Verification Upload
          </h2>

          <Input
            label="Voucher Secret Code / Card PIN *"
            type="text"
            placeholder="e.g. MYN-4921-9920-ABCD"
            value={form.voucherCode}
            onChange={(e) => setForm({ ...form, voucherCode: e.target.value })}
            hint="Kept strictly confidential and encrypted. Revealed to buyer only after payment is captured in escrow."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-bee-black mb-1.5">
                Voucher Screenshot / E-Mail (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setVoucherImage(e.target.files?.[0] || null)}
                className="text-xs text-bee-gray file:mr-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-semibold file:bg-bee-yellow file:text-bee-black hover:file:bg-bee-yellow-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bee-black mb-1.5">
                Purchase Receipt / Balance Proof (Optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                className="text-xs text-bee-gray file:mr-3 file:py-2 file:px-4 file:rounded-input file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-bee-black hover:file:bg-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-bee-black mb-1.5">
              Additional Notes / Redemption Instructions
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Valid only on app, cannot be clubbed with other coupons, unstacked..."
              className="input-field"
            />
          </div>
        </div>

        {/* Priority Verification Upgrade */}
        <div className="card p-6 bg-gradient-to-r from-bee-yellow-light/40 to-white border-bee-yellow flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-bee-black">⚡ Priority Fast-Track Verification</span>
              <span className="bg-bee-yellow text-bee-black text-xs font-bold px-2 py-0.5 rounded-full">₹99</span>
            </div>
            <p className="text-xs text-bee-gray mt-1">
              Skip the queue! Get verified and live within 6 hours instead of standard 24-hour SLA.
            </p>
          </div>
          <input
            type="checkbox"
            id="priority"
            checked={form.isPriorityVerification}
            onChange={(e) => setForm({ ...form, isPriorityVerification: e.target.checked })}
            className="w-5 h-5 accent-bee-yellow rounded cursor-pointer"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={submitting}
          >
            Save Draft
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={submitting}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Submit for 24h Verification
          </Button>
        </div>
      </form>
    </div>
  );
}
