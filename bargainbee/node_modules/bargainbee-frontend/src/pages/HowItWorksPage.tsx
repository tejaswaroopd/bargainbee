import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Clock, Lock, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function HowItWorksPage() {
  const navigate = useNavigate();

  const steps = [
    {
      num: '01',
      title: 'List Your Voucher in Under 2 Minutes',
      role: 'For Sellers',
      icon: '📝',
      desc: 'Pick from popular brands (Myntra, Apple, Zomato, Croma, etc.), set your face value and asking price. Upload an image of the digital gift card or receipt proof.',
      details: [
        'Draft saving available — resume anytime',
        'Automatic discount percentage calculation',
        'Optional ₹99 Priority Verification for 6-hour SLA fast-track',
      ],
    },
    {
      num: '02',
      title: '24-Hour Verification & Authenticity Check',
      role: 'Platform Verification',
      icon: '🔍',
      desc: 'Our compliance specialists verify the voucher authenticity, test balance integrity, confirm expiration terms, and ensure no duplicate listings exist.',
      details: [
        'Strict 24-hour verification turnaround SLA',
        'Badged with "Verified ✅" once approved',
        'Encrypted storage of secret voucher codes until purchase',
      ],
    },
    {
      num: '03',
      title: 'Discovery & Smart Filter Search',
      role: 'For Buyers',
      icon: '🛍️',
      desc: 'Buyers browse verified listings across Fashion, Electronics, Food, Lifestyle and more. Filter by brand, discount percentage, budget, or urgency.',
      details: [
        'Seller reputation score & past review track record',
        'Urgency countdown timers on expiring vouchers',
        'Wishlist alerts when your favourite brand gets listed',
      ],
    },
    {
      num: '04',
      title: 'Secure Escrow-Protected Checkout',
      role: 'Buyer & Escrow',
      icon: '🛡️',
      desc: 'When a buyer clicks Buy, payment is processed via Razorpay (UPI, Credit/Debit, Netbanking). Crucially, the payment is held in Escrow — not immediately sent to the seller.',
      details: [
        'Zero risk of losing money on faulty codes',
        'Voucher code and PIN instantly revealed to buyer',
        '7-day protection window with dispute mediation',
      ],
    },
    {
      num: '05',
      title: 'Instant Redemption & Fund Settlement',
      role: 'Settlement & Release',
      icon: '🎉',
      desc: 'Buyer uses the voucher on the brand website or store. Once validated, buyer confirms delivery and escrow funds are instantly released to the seller.',
      details: [
        'Fair platform commission (5%) automatically deducted',
        'Mutual ratings and reviews left for community reputation',
        'Automated release if no dispute is raised within 7 days',
      ],
    },
  ];

  return (
    <div className="page-container py-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-wider text-bee-black bg-bee-yellow px-3 py-1 rounded-full">
          The BargainBee Model
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-bee-black mt-4">
          How BargainBee Works
        </h1>
        <p className="text-bee-gray text-base sm:text-lg mt-3 leading-relaxed">
          From unused gift cards gathering dust to secure escrow-protected savings — our 5-step lifecycle guarantees trust on both sides of every transaction.
        </p>
      </div>

      {/* Steps vertical cards */}
      <div className="space-y-8 max-w-4xl mx-auto">
        {steps.map((s, idx) => (
          <div
            key={s.num}
            className="card p-6 sm:p-8 hover:shadow-card-hover transition-all duration-200 border-l-8 border-l-bee-yellow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{s.icon}</span>
                <div>
                  <span className="text-xs font-bold text-bee-yellow-dark uppercase tracking-widest">
                    Step {s.num} • {s.role}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-bee-black">{s.title}</h2>
                </div>
              </div>
            </div>

            <p className="text-bee-gray text-sm sm:text-base leading-relaxed pl-0 sm:pl-12">
              {s.desc}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100 pl-0 sm:pl-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {s.details.map((d) => (
                <div key={d} className="flex items-start gap-2 text-xs text-bee-black font-medium">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center bg-bee-black text-white p-10 rounded-card max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold">Ready to Put Value in Motion?</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto">
          Join thousands of smart shoppers and sellers unlocking trapped value with escrow safety.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button variant="primary" size="lg" onClick={() => navigate('/browse')}>
            Browse Vouchers
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/sell')}>
            List a Voucher
          </Button>
        </div>
      </div>
    </div>
  );
}
