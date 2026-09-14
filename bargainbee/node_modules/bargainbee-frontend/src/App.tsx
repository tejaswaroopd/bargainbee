import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/Toaster';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import WhyBargainBeePage from './pages/WhyBargainBeePage';
import BrowsePage from './pages/BrowsePage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateListingPage from './pages/CreateListingPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminVerificationQueuePage from './pages/AdminVerificationQueuePage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ChatPage from './pages/ChatPage';
import WishlistPage from './pages/WishlistPage';
import PublicProfilePage from './pages/PublicProfilePage';
import { useAuthStore } from './store/authStore';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        {/* Public routes with main navbar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/why-bargainbee" element={<WhyBargainBeePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/profile/:id" element={<PublicProfilePage />} />
        </Route>

        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/sell"
            element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>}
          />
          <Route
            path="/wishlist"
            element={<ProtectedRoute><WishlistPage /></ProtectedRoute>}
          />
          <Route
            path="/orders/:id"
            element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>}
          />
          <Route
            path="/chat/:roomId"
            element={<ProtectedRoute><ChatPage /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/seller"
            element={<ProtectedRoute roles={['SELLER', 'BOTH', 'ADMIN']}><SellerDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/buyer"
            element={<ProtectedRoute><BuyerDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin"
            element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/queue"
            element={<ProtectedRoute roles={['ADMIN']}><AdminVerificationQueuePage /></ProtectedRoute>}
          />
          <Route
            path="/dashboard/admin/analytics"
            element={<ProtectedRoute roles={['ADMIN']}><AdminAnalyticsPage /></ProtectedRoute>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
