function ensureLeadingSlash(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeBaseUrl(baseUrl: string | undefined): string {
  if (!baseUrl || baseUrl === '/') return '/';
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function appHref(path: string, baseUrl: string | undefined = import.meta.env.BASE_URL): string {
  const normalizedPath = ensureLeadingSlash(path);
  const normalizedBase = normalizeBaseUrl(baseUrl);

  if (normalizedBase === '/') return normalizedPath;
  if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) return normalizedPath;
  if (normalizedPath === '/') return `${normalizedBase}/`;
  return `${normalizedBase}${normalizedPath}`;
}

export function normalizeAppPath(path: string, baseUrl: string | undefined = import.meta.env.BASE_URL): string {
  const normalizedPath = ensureLeadingSlash(path);
  const normalizedBase = normalizeBaseUrl(baseUrl);
  // Desktop app always serves frontend pages under /app/.
  // Keep active-nav matching robust even when runtime path contains /app prefix.
  if (normalizedPath === '/app') return '/';
  if (normalizedPath.startsWith('/app/')) return normalizedPath.slice('/app'.length);

  if (normalizedBase === '/') return normalizedPath;
  if (normalizedPath === normalizedBase) return '/';
  if (normalizedPath.startsWith(`${normalizedBase}/`)) {
    const stripped = normalizedPath.slice(normalizedBase.length);
    return stripped.length > 0 ? stripped : '/';
  }
  return normalizedPath;
}
