import { useState, useEffect } from 'react';

export interface ResolvedAssetId {
  /** The resolved asset id, or `null` when none could be determined. */
  resolvedAssetId: string | null;
  /** `true` until the id has been resolved after mount. */
  isResolving: boolean;
}

/**
 * Resolves an asset id from an explicit prop or the `?id=` query parameter.
 *
 * The lookup runs inside `useEffect` (client-only) rather than during render
 * so the server and the first client render produce identical markup. The
 * host page mounts this island with `client:load`, so reading
 * `window.location.search` during render would trigger a hydration mismatch
 * (server has no `window`, client does).
 */
export function useResolvedAssetId(explicitId?: string): ResolvedAssetId {
  const [resolvedAssetId, setResolvedAssetId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    if (explicitId) {
      setResolvedAssetId(explicitId);
    } else {
      const id = new URLSearchParams(window.location.search).get('id');
      setResolvedAssetId(id && id.length > 0 ? id : null);
    }
    setIsResolving(false);
  }, [explicitId]);

  return { resolvedAssetId, isResolving };
}
