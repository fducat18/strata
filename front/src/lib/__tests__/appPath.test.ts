import { appHref, normalizeAppPath } from '../appPath';

describe('appPath helpers', () => {
  it('keeps root-based paths in web mode', () => {
    expect(appHref('/assets', '/')).toBe('/assets');
    expect(appHref('/', '/')).toBe('/');
  });

  it('prefixes paths with /app in desktop static mode', () => {
    expect(appHref('/assets', '/app/')).toBe('/app/assets');
    expect(appHref('/settings', '/app')).toBe('/app/settings');
    expect(appHref('/', '/app/')).toBe('/app/');
  });

  it('normalizes /app-prefixed current paths to app-internal route paths', () => {
    expect(normalizeAppPath('/app/assets', '/app/')).toBe('/assets');
    expect(normalizeAppPath('/app', '/app/')).toBe('/');
  });
});
