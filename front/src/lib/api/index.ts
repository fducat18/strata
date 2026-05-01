export { api, createApiClient, type ApiError } from './client';
export { assetApi } from './assets';
export { categoryApi } from './categories';
export { tagApi } from './tags';
export { assetTypeApi } from './assetTypes';
export { backupApi, type BackupPayload } from './backup';
export {
  getPortfolioSnapshots,
  getCurrentPortfolioValue,
  createPortfolioSnapshot,
  deletePortfolioSnapshot,
  type CurrentPortfolioValue,
  type CreatePortfolioSnapshotDto,
} from './portfolio-snapshots';
