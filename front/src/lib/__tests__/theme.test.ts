import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredTheme, setTheme, applyTheme } from '@/lib/theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('getStoredTheme', () => {
    it('returns system as default', () => {
      expect(getStoredTheme()).toBe('system');
    });

    it('returns stored theme', () => {
      localStorage.setItem('strata.theme', 'dark');
      expect(getStoredTheme()).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('stores theme in localStorage', () => {
      setTheme('dark');
      expect(localStorage.getItem('strata.theme')).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('adds dark class for dark theme', () => {
      applyTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class for light theme', () => {
      document.documentElement.classList.add('dark');
      applyTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
