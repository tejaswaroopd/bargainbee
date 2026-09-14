import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, TrendingUp, Users, DollarSign, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StatsCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { formatCurrency } from '../utils';
import api from '../api/client';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics');
      return data;
    },
  });

  const { data: disputes } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data } = await api.get('/admin/disputes');
      return data.disputes;
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-bee-black">Platform Admin</h1>
          <p className="text-bee-gray text-sm mt-1">Platform overview, GMV metrics, and verification queue.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/dashboard/admin/analytics')}>
            Detailed Analytics
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard/admin/queue')} icon={<ShieldCheck className="w-4 h-4" />}>
            Verification Queue ({analytics?.pendingVerification || 0})
          </Button>
        </div>
      </div>

      {/* Top High-Level Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Gross Merchandise Value (GMV)"
          value={formatCurrency(analytics?.gmv || 0)}
          icon="💳"
          subtext="Settled through escrow"
          accent
        />
        <StatsCard
          label="Platform Revenue (5% Take Rate)"
          value={formatCurrency(analytics?.totalCommission || 0)}
          icon="🐝"
          subtext="Commission & fast-track fees"
        />
        <StatsCard
          label="Pending Verification SLA"
          value={analytics?.pendingVerification || 0}
          icon="⏳"
          subtext="Awaiting authenticity check"
        />
        <StatsCard
          label="Active Disputes"
          value={disputes?.length || 0}
          icon="⚠️"
          subtext="Requires admin mediation"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-bee-black">Verification Queue</h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {analytics?.pendingVerification || 0} In Queue
            </span>
          </div>
          <p className="text-sm text-bee-gray mb-6">
            Review new voucher submissions, run balance authenticity checks, and approve listings within the 24h SLA.
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/dashboard/admin/queue')}>
            Open Verification Queue →
          </Button>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-bee-black">Active Disputes Mediation</h2>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
              {disputes?.length || 0} Active
            </span>
          </div>
          <p className="text-sm text-bee-gray mb-6">
            Review buyer dispute claims, verify merchant receipts, and release escrow or issue full buyer refunds.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/dashboard/admin/analytics')}>
            Review Disputes & Policies →
          </Button>
        </div>
      </div>
    </div>
  );
}
