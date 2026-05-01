import { render, screen, fireEvent } from '@testing-library/react';
import { LocaleSection } from '../LocaleSection';
import { useSettingsStore } from '@/stores/settingsStore';

describe('LocaleSection', () => {
  beforeEach(() => {
    useSettingsStore.setState({ locale: 'en-US', currency: 'EUR' });
  });

  it('renders Locale & Currency heading', () => {
    render(<LocaleSection />);
    expect(screen.getByText('Locale & Currency')).toBeInTheDocument();
  });

  it('shows current locale selected', () => {
    render(<LocaleSection />);
    const localeSelect = screen.getByLabelText('Display locale') as HTMLSelectElement;
    expect(localeSelect.value).toBe('en-US');
  });

  it('shows current currency selected', () => {
    render(<LocaleSection />);
    const currencySelect = screen.getByLabelText('Default currency') as HTMLSelectElement;
    expect(currencySelect.value).toBe('EUR');
  });

  it('updates locale on change', () => {
    render(<LocaleSection />);
    const localeSelect = screen.getByLabelText('Display locale');
    fireEvent.change(localeSelect, { target: { value: 'fr-FR' } });
    expect(useSettingsStore.getState().locale).toBe('fr-FR');
  });

  it('updates currency on change', () => {
    render(<LocaleSection />);
    const currencySelect = screen.getByLabelText('Default currency');
    fireEvent.change(currencySelect, { target: { value: 'USD' } });
    expect(useSettingsStore.getState().currency).toBe('USD');
  });
});
