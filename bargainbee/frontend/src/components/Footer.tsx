import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-bee-black text-white mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🐝</span>
              <span className="text-xl font-bold">Bargain<span className="text-bee-yellow">Bee</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              India's trusted marketplace for buying and selling unused vouchers & gift cards.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/browse" className="hover:text-bee-yellow">Browse Vouchers</Link></li>
              <li><Link to="/sell" className="hover:text-bee-yellow">Sell a Voucher</Link></li>
              <li><Link to="/how-it-works" className="hover:text-bee-yellow">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/why-bargainbee" className="hover:text-bee-yellow">Why BargainBee</Link></li>
              <li><a href="#" className="hover:text-bee-yellow">About Us</a></li>
              <li><a href="#" className="hover:text-bee-yellow">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-bee-yellow">Help Center</a></li>
              <li><a href="#" className="hover:text-bee-yellow">Dispute Resolution</a></li>
              <li><a href="#" className="hover:text-bee-yellow">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© 2025 BargainBee. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-bee-yellow">Privacy Policy</a>
            <a href="#" className="hover:text-bee-yellow">Terms of Service</a>
            <a href="#" className="hover:text-bee-yellow">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
