import { QueryProvider } from '@/lib/queryClient';
import { AssetListPage as ListInner } from './AssetListPage';
import { AssetDetailPage as DetailInner } from './AssetDetailPage';
export function AssetListPage() {
  return <QueryProvider><ListInner /></QueryProvider>;
}
export function AssetDetailPage(props: { assetId: string }) {
  return <QueryProvider><DetailInner {...props} /></QueryProvider>;
}
