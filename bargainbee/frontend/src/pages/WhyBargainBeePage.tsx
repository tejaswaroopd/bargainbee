import { Check, X, Shield, Lock, Zap, Award, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function WhyBargainBeePage() {
  const navigate = useNavigate();

  const comparisonRows = [
    {
      feature: 'Pre-Listing Verification',
      bargainBee: '24-hour verification SLA: Authenticity, balance, expiry checks',
      informal: 'None (Buyer blindly trusts screenshots or chat claims)',
    },
    {
      feature: 'Payment Security',
      bargainBee: 'Escrow holding: Seller gets paid only after successful redemption',
      informal: 'Direct UPI transfer before code is shared (Extreme fraud risk)',
    },
    {
      feature: 'Fraud & Duplicate Protection',
      bargainBee: 'Algorithmic code deduplication & identity-linked seller profiles',
      informal: 'Voucher codes frequently sold to multiple buyers simultaneously',
    },
    {
      feature: 'Dispute Mediation',
      bargainBee: 'Platform admin mediates disputes with 100% refund protection',
      informal: 'Zero recourse (Seller blocks or deletes chat on Telegram/WhatsApp)',
    },
    {
      feature: 'Nationwide Reach & Speed',
      bargainBee: 'Instant digital delivery across India with smart search & filters',
      informal: 'Restricted to local classifieds or chaotic message board groups',
    },
    {
      feature: 'Pricing Transparency',
      bargainBee: 'Clear face-value vs asking-price discount % with fee breakdowns',
      informal: 'Arbitrary bargaining with zero market price benchmarking',
    },
    {
      feature: 'Community Trust History',
      bargainBee: 'Verified buyer/seller reviews and transparent rep scores',
      informal: 'Anonymous burners with fake testimonials',
    },
  ];

  return (
    <div className="page-container py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-bee-black bg-bee-yellow px-3 py-1 rounded-full">
          The Trust Benchmark
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-bee-black mt-4">
          Why BargainBee vs. Informal Resale
        </h1>
        <p className="text-bee-gray text-base sm:text-lg mt-3 leading-relaxed">
          See how our structured marketplace replaces peer-to-peer uncertainty with ironclad escrow guarantees.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="card overflow-hidden shadow-card mb-16 border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="p-4 sm:p-5 font-bold text-sm text-bee-black w-1/3">Feature</th>
                <th className="p-4 sm:p-5 font-bold text-sm text-bee-black bg-bee-yellow/20 w-1/3 border-x border-bee-yellow/30">
                  <div className="flex items-center gap-1.5">
                    <span>🐝 BargainBee</span>
                    <span className="text-xs font-normal text-gray-600">(Verified & Protected)</span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 font-bold text-sm text-gray-500 w-1/3">
                  Informal Resale (OLX, Telegram, Reddit)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {comparisonRows.map((row, idx) => (
                <tr key={row.feature} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-4 sm:p-5 font-semibold text-bee-black">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 bg-bee-yellow/10 border-x border-bee-yellow/30 font-medium text-bee-black">
                    <div className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span>{row.bargainBee}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-gray-500">
                    <div className="flex items-start gap-2">
                      <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <span>{row.informal}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Three Pillars of Trust */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
        <div className="card p-6 border-t-4 border-t-bee-yellow">
          <Shield className="w-8 h-8 text-bee-yellow mb-4" />
          <h3 className="font-bold text-lg text-bee-black">Escrow Guarantee</h3>
          <p className="text-xs text-bee-gray mt-2 leading-relaxed">
            Your money stays in our escrow vault until you confirm the voucher code works on the brand store.
          </p>
        </div>

        <div className="card p-6 border-t-4 border-t-green-500">
          <Award className="w-8 h-8 text-green-500 mb-4" />
          <h3 className="font-bold text-lg text-bee-black">Rigorous 24-hr SLA</h3>
          <p className="text-xs text-bee-gray mt-2 leading-relaxed">
            Every voucher undergoes balance checks, expiry validation, and authenticity screening before hitting the live feed.
          </p>
        </div>

        <div className="card p-6 border-t-4 border-t-bee-black">
          <Lock className="w-8 h-8 text-bee-black mb-4" />
          <h3 className="font-bold text-lg text-bee-black">Anti-Fraud Protection</h3>
          <p className="text-xs text-bee-gray mt-2 leading-relaxed">
            Proprietary deduplication prevents double-selling. Contact masking stops off-platform scams.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Button size="lg" variant="primary" onClick={() => navigate('/browse')}>
          Browse Verified Deals Now →
        </Button>
      </div>
    </div>
  );
}
