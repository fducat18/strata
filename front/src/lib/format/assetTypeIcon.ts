const ASSET_TYPE_ICONS: Record<string, string> = {
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

export function getAssetTypeIcon(code: string): string {
  return ASSET_TYPE_ICONS[code] || '📦';
}
