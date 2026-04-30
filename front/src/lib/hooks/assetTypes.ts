import { useQuery } from '@tanstack/react-query';
import { assetTypeApi } from '../api';
import { queryKeys } from './queryKeys';

export function useAssetTypes() {
  return useQuery({ queryKey: queryKeys.assetTypes, queryFn: assetTypeApi.getAll });
}
