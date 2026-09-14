import { format, formatDistanceToNow, differenceInDays, parseISO } from 'date-fns';

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy');
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true });
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  return differenceInDays(parseISO(expiryDate), new Date());
};

export const getExpiryUrgency = (expiryDate: string): 'safe' | 'warning' | 'urgent' => {
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'warning';
  return 'safe';
};

export const CATEGORY_LABELS: Record<string, string> = {
  FASHION: 'Fashion',
  ELECTRONICS: 'Electronics',
  FOOD_DINING: 'Food & Dining',
  LIFESTYLE: 'Lifestyle',
  TRAVEL: 'Travel',
  ENTERTAINMENT: 'Entertainment',
  HEALTH_BEAUTY: 'Health & Beauty',
  GROCERY: 'Grocery',
};

export const CATEGORY_ICONS: Record<string, string> = {
  FASHION: '👗',
  ELECTRONICS: '📱',
  FOOD_DINING: '🍽️',
  LIFESTYLE: '✨',
  TRAVEL: '✈️',
  ENTERTAINMENT: '🎬',
  HEALTH_BEAUTY: '💆',
  GROCERY: '🛒',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  VERIFIED: 'bg-green-50 text-green-700 border border-green-200',
  LIVE: 'bg-blue-50 text-blue-700 border border-blue-200',
  SOLD: 'bg-purple-50 text-purple-700',
  EXPIRED: 'bg-red-50 text-red-600',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
};

export const cn = (...classes: (string | number | boolean | undefined | null)[]): string => {
  return classes.filter(Boolean).join(' ');
};
