import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Zap, Repeat, TrendingDown, ArrowRight, CheckCircle2, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { fetchListings } from '../api/listings';
import { VoucherCard } from '../components/VoucherCard';
import { Button } from '../components/ui/Button';
import { VoucherListing } from '../types';
import { PageLoader } from '../components/ui/Spinner';

export default function LandingPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => fetchListings({ limit: 4, sort: 'discount' }),
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bee-yellow-light/40 via-white to-bee-surface pt-12 pb-20 md:pt-20 md:pb-28 border-b border-gray-100">
        <div className="page-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-bee-yellow shadow-sm text-xs font-semibold text-bee-black mb-6 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              India's #1 Secure Voucher & Gift Card Exchange
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-bee-black tracking-tight leading-[1.15]">
              Don't let value expire.{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-bee-black">List it. Discover it.</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-bee-yellow -z-0 transform -rotate-1 rounded" />
              </span>{' '}
              Redeem it.
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-bee-gray leading-relaxed max-w-2xl mx-auto">
              Turn unused store credits and vouchers into instant cash. Or discover verified brand deals with guaranteed escrow protection.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="primary" onClick={() => navigate('/browse')} icon={<ArrowRight className="w-5 h-5" />}>
                Browse Deals
              </Button>
              <Button size="lg" variant="dark" onClick={() => navigate('/sell')}>
                Sell a Voucher in 2 Mins
              </Button>
            </div>

            {/* Trust highlights */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-bee-gray font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                24h Human & SLA Verification
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-bee-yellow-dark" />
                Escrow Funds Protection
              </div>
              <div className="flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-blue-600" />
                Instant Digital Code Delivery
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Market Reality Stats */}
      <section className="py-14 bg-bee-black text-white">
        <div className="page-container">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold">Why Millions Leave Money on the Table</h2>
            <p className="text-sm text-gray-400 mt-2">Voucher waste is a massive global and Indian economic blind spot.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-bee-black-soft p-6 rounded-card border border-gray-800 text-center">
              <p className="text-4xl font-black text-bee-yellow">43%</p>
              <p className="text-sm font-semibold mt-2">Consumers Hold Unused Vouchers</p>
              <p className="text-xs text-gray-400 mt-1">Forgotten in SMS, email threads, and wallet drawers.</p>
            </div>

            <div className="bg-bee-black-soft p-6 rounded-card border border-gray-800 text-center">
              <p className="text-4xl font-black text-bee-yellow">$23B+</p>
              <p className="text-sm font-semibold mt-2">Unspent Value Globally</p>
              <p className="text-xs text-gray-400 mt-1">Expired without benefit to cardholders each year.</p>
            </div>

            <div className="bg-bee-black-soft p-6 rounded-card border border-gray-800 text-center">
              <p className="text-4xl font-black text-bee-yellow">~18%</p>
              <p className="text-sm font-semibold mt-2">Annual CAGR in India</p>
              <p className="text-xs text-gray-400 mt-1">Surging corporate rewards, e-commerce, and festival gifting.</p>
            </div>

            <div className="bg-bee-black-soft p-6 rounded-card border border-gray-800 text-center">
              <p className="text-4xl font-black text-green-400">100%</p>
              <p className="text-sm font-semibold mt-2">Escrow Protected</p>
              <p className="text-xs text-gray-400 mt-1">Funds are released only when buyer confirms validity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Deals */}
      <section className="py-16 page-container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-bee-gray mb-1">
              <Sparkles className="w-3.5 h-3.5 text-bee-yellow" />
              Hand-picked Savings
            </div>
            <h2 className="text-3xl font-bold text-bee-black">Hot Verified Deals</h2>
          </div>
          <Link to="/browse" className="mt-2 sm:mt-0 text-sm font-semibold text-bee-black hover:text-bee-yellow-dark flex items-center gap-1">
            Explore all vouchers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data?.listings?.map((listing: VoucherListing) => (
              <VoucherCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Teaser */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-bee-black">5 Simple Steps to Liquid Value</h2>
            <p className="text-bee-gray mt-2 text-sm sm:text-base">
              The only P2P platform that combines 24h verification with an escrow holding shield.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: '1', title: 'List in 2 Min', desc: 'Enter brand, balance, asking price, and proof snapshot.' },
              { step: '2', title: 'Verify SLA', desc: 'Admin checks authenticity, remaining balance, and validity.' },
              { step: '3', title: 'Discover', desc: 'Buyers find verified deals across Fashion, Electronics, Dining.' },
              { step: '4', title: 'Escrow Lock', desc: 'Buyer pays securely; funds stay safely locked in escrow.' },
              { step: '5', title: 'Redeem & Release', desc: 'Code revealed instantly. Buyer redeems, seller gets paid.' },
            ].map((s) => (
              <div key={s.step} className="p-5 rounded-card bg-bee-surface border border-gray-100 text-center relative">
                <div className="w-9 h-9 rounded-full bg-bee-yellow text-bee-black font-extrabold flex items-center justify-center mx-auto mb-3 shadow-sm">
                  {s.step}
                </div>
                <h3 className="font-bold text-bee-black text-base">{s.title}</h3>
                <p className="text-xs text-bee-gray mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="secondary" onClick={() => navigate('/how-it-works')}>
              Read Full 5-Step Deep Dive →
            </Button>
          </div>
        </div>
      </section>

      {/* Why BargainBee Comparison Banner */}
      <section className="py-16 page-container">
        <div className="card p-8 sm:p-12 bg-gradient-to-br from-bee-yellow-light/60 to-white border-bee-yellow flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-bee-black bg-bee-yellow px-2.5 py-1 rounded-full">
              Trust & Safety First
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-bee-black mt-3">
              Tired of Telegram Scams & Olx Flakes?
            </h2>
            <p className="text-bee-gray text-sm mt-3 leading-relaxed">
              Informal resale has high fraud rates, chargebacks, and zero recourse. BargainBee replaces untrusted chats with authenticated balances, escrow holds, and instant resolution.
            </p>
          </div>
          <Button size="lg" variant="dark" onClick={() => navigate('/why-bargainbee')}>
            See Comparison Table →
          </Button>
        </div>
      </section>
    </div>
  );
}
