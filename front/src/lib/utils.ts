import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatMoney } from './format/formatMoney';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Thin wrapper around formatMoney for backward compat — no parseFloat. */
export function formatCurrency(value: string | number, currency = 'EUR'): string {
  return formatMoney(value, { currency });
}

export { formatDate, formatDateTime } from './format/formatDate';
export { formatQuantity } from './format/formatNumber';
export { getAssetTypeIcon } from './format/assetTypeIcon';
