import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-bee-surface flex">
      {/* Left panel - brand */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-bee-black p-12">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-3xl">🐝</span>
          <span className="text-2xl font-bold text-white">Bargain<span className="text-bee-yellow">Bee</span></span>
        </Link>
        <div>
          <blockquote className="text-2xl font-bold text-white leading-snug">
            "Don't let value expire."
          </blockquote>
          <p className="text-gray-400 mt-3 text-base">
            List it, discover it, redeem it. India's most trusted voucher marketplace.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { value: '43%', label: 'of consumers hold unused vouchers' },
              { value: '\$23B+', label: 'unspent gift card value globally' },
              { value: '18%', label: 'CAGR in India gift card market' },
              { value: '100%', label: 'verified listings, safe escrow' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800 rounded-card p-4">
                <p className="text-bee-yellow text-xl font-bold">{s.value}</p>
                <p className="text-gray-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 text-xs">© 2025 BargainBee. Secured & verified marketplace.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-bee-black">Bargain<span className="text-bee-yellow">Bee</span></span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
