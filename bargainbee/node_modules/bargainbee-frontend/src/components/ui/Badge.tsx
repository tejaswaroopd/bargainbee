import { cn } from '../../utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'verified' | 'pending' | 'live' | 'sold' | 'draft' | 'rejected' | 'expired' | 'yellow' | 'gray';
  className?: string;
}

const VARIANTS = {
  verified: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  live: 'bg-blue-50 text-blue-700 border border-blue-200',
  sold: 'bg-purple-50 text-purple-700',
  draft: 'bg-gray-100 text-gray-600',
  rejected: 'bg-red-50 text-red-700 border border-red-200',
  expired: 'bg-red-50 text-red-600',
  yellow: 'bg-bee-yellow-light text-bee-black border border-bee-yellow',
  gray: 'bg-gray-100 text-gray-700',
};

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full',
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    DRAFT: { label: 'Draft', variant: 'draft' },
    PENDING: { label: '⏳ Pending Verification', variant: 'pending' },
    VERIFIED: { label: '✅ Verified', variant: 'verified' },
    LIVE: { label: '🟢 Live', variant: 'live' },
    SOLD: { label: 'Sold', variant: 'sold' },
    EXPIRED: { label: 'Expired', variant: 'expired' },
    REJECTED: { label: '❌ Rejected', variant: 'rejected' },
  };
  const { label, variant } = map[status] || { label: status, variant: 'gray' as const };
  return <Badge variant={variant}>{label}</Badge>;
}
