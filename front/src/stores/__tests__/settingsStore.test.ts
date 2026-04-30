import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ locale: 'en-US', currency: 'EUR' });
  });

  it('has sensible defaults', () => {
    const s = useSettingsStore.getState();
    expect(typeof s.locale).toBe('string');
    expect(s.currency).toBe('EUR');
  });

  it('setLocale updates and persists', () => {
    useSettingsStore.getState().setLocale('fr-FR');
    expect(useSettingsStore.getState().locale).toBe('fr-FR');
    expect(localStorage.getItem('strata.settings')).toContain('"locale":"fr-FR"');
  });

  it('setCurrency updates and persists', () => {
    useSettingsStore.getState().setCurrency('USD');
    expect(useSettingsStore.getState().currency).toBe('USD');
    expect(localStorage.getItem('strata.settings')).toContain('"currency":"USD"');
  });
});
