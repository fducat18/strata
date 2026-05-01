import { render, screen } from '@testing-library/react';
import { SettingsPage } from '../SettingsPage';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';

vi.mock('../BackupSection', () => ({
  BackupSection: () => <div data-testid="backup-section">Backup</div>,
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system' });
    useSettingsStore.setState({ locale: 'en-US', currency: 'EUR' });
  });

  it('renders the Settings heading', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders theme section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('renders locale section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Locale & Currency')).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('About Strata')).toBeInTheDocument();
  });
});
