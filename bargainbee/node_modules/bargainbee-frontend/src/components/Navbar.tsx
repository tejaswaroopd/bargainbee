import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, User, ChevronDown, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/Button';
import { cn } from '../utils';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/browse', label: 'Browse' },
    { to: '/how-it-works', label: 'How It Works' },
    { to: '/why-bargainbee', label: 'Why BargainBee' },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold text-bee-black">Bargain<span className="text-bee-yellow">Bee</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-bee-gray hover:text-bee-black transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/sell')}
                  icon={<ShoppingBag className="w-4 h-4" />}
                >
                  Sell a Voucher
                </Button>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-input hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-bee-yellow flex items-center justify-center text-bee-black font-semibold text-sm">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-bee-black">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4 text-bee-gray" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-card shadow-card-hover border border-gray-100 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-semibold text-bee-black">{user.name}</p>
                        <p className="text-xs text-bee-gray">{user.email}</p>
                      </div>
                      <Link
                        to={user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'BUYER' ? '/dashboard/buyer' : '/dashboard/seller'}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-bee-black hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      {['SELLER', 'BOTH', 'ADMIN'].includes(user.role) && (
                        <Link
                          to="/dashboard/seller"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-bee-black hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShoppingBag className="w-4 h-4" /> Seller Dashboard
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth/login')}>Sign In</Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/auth/register')}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-bee-gray"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="page-container py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-3 py-2 text-sm font-medium text-bee-black hover:bg-gray-50 rounded-input"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!user ? (
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => { navigate('/auth/login'); setMobileOpen(false); }}>Sign In</Button>
                <Button variant="primary" size="sm" className="flex-1" onClick={() => { navigate('/auth/register'); setMobileOpen(false); }}>Get Started</Button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-input"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
