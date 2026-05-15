import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getStoredTheme, setTheme, applyTheme, initTheme } from '@/lib/theme';

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.style.backgroundColor = '';
    document.documentElement.style.color = '';
    document.documentElement.style.colorScheme = '';
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

    it('applies prepaint-safe styles for dark theme', () => {
      applyTheme('dark');
      expect(document.documentElement.style.backgroundColor).toBe('#0f172a');
      expect(document.documentElement.style.color).toBe('#f8fafc');
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });
  });

  describe('initTheme', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
      });
    });

    it('registers matchMedia listener when stored theme is system', () => {
      const addEventListenerMock = vi.fn();
      window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: addEventListenerMock });
      localStorage.setItem('strata.theme', 'system');
      initTheme();
      expect(addEventListenerMock).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('does not register matchMedia listener for non-system theme', () => {
      const addEventListenerMock = vi.fn();
      window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: addEventListenerMock });
      localStorage.setItem('strata.theme', 'dark');
      initTheme();
      expect(addEventListenerMock).not.toHaveBeenCalled();
    });
  });
});
