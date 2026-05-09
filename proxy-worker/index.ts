/**
 * Cloudflare Worker — Strata Docs Proxy
 *
 * Routes:
 *   /docs*   → DOCS_ORIGIN (Strata docs static site, default: strata-eep.pages.dev)
 *   /*       → pass-through (handled by Cloudflare Pages for the front app)
 *
 * Environment variables (set in Cloudflare dashboard or wrangler.toml):
 *   DOCS_ORIGIN  — origin URL of the docs Pages project (no trailing slash)
 *                  Default: https://strata-eep.pages.dev
 *
 * See proxy-worker/README.md for deployment instructions.
 */

interface Env {
  DOCS_ORIGIN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const docsOrigin = env.DOCS_ORIGIN ?? 'https://strata-eep.pages.dev';

    if (url.pathname.startsWith('/docs')) {
      // Keep /docs prefix because docs Astro config uses base='/docs'.
      const proxied = new URL(url.pathname, docsOrigin);
      proxied.search = url.search;

      const proxyReq = new Request(proxied.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        redirect: 'follow',
      });

      const response = await fetch(proxyReq);

      // Rewrite absolute URLs in HTML so links stay on the main domain.
      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        const rewritten = text.replace(
          new RegExp(docsOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          `${url.protocol}//${url.host}`,
        );
        return new Response(rewritten, {
          status: response.status,
          headers: response.headers,
        });
      }

      return response;
    }

    // All other routes: pass through to main origin.
    return fetch(request);
  },
} satisfies ExportedHandler<Env>;
