/**
 * Decimal-safe money formatter.
 *
 * Monetary values arrive from the backend as strings (Prisma Decimal). We
 * keep them as strings or as decimal.js `Decimal` instances throughout the
 * app and only convert to `Number` at the very last step (Intl.NumberFormat
 * has no Decimal support). NEVER `parseFloat` a money value before this.
 */
import Decimal from 'decimal.js';

export type MoneyInput = string | number | Decimal | null | undefined;

export interface MoneyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function toDecimal(value: MoneyInput): Decimal | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    return new Decimal(value as Decimal.Value);
  } catch {
    return null;
  }
}

export function formatMoney(
  value: MoneyInput,
  options: MoneyFormatOptions = {}
): string {
  const {
    currency = 'EUR',
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const dec = toDecimal(value);
  if (!dec) return '—';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(dec.toNumber());
}
