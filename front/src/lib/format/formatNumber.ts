/**
 * Decimal-safe quantity formatter — for asset quantities that may have up
 * to 8 decimal places (Bitcoin satoshi precision). Trailing zeros trimmed.
 */
import Decimal from 'decimal.js';
import type { MoneyInput } from './formatMoney';

export function formatQuantity(value: MoneyInput): string {
  if (value === null || value === undefined || value === '') return '—';
  let dec: Decimal;
  try {
    dec = new Decimal(value as Decimal.Value);
  } catch {
    return '—';
  }
  if (dec.isInteger()) return dec.toFixed(0);
  return dec.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
}
