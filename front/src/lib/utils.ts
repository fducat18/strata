import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number, currency = 'EUR'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatQuantity(value: string | number | null): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === Math.floor(num)) return num.toString();
  return num.toFixed(8).replace(/0+$/, '');
}

export function getAssetTypeIcon(code: string): string {
  const icons: Record<string, string> = {
    CHECKING_ACCOUNT: '🏦',
    SAVINGS_ACCOUNT: '💰',
    CASH: '💵',
    REAL_ESTATE: '🏠',
    STOCKS: '📈',
    CRYPTO: '₿',
    BONDS: '📋',
    PERSONAL_PROPERTY: '🏷️',
    VEHICLE: '🚗',
    LOAN: '💳',
    COLLECTIBLES: '🎨',
    BUSINESS: '🏢',
    OTHER: '📦',
  };
  return icons[code] || '📦';
}
