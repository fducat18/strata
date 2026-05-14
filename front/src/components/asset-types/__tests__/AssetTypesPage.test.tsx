import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/lib/hooks', () => ({
  useAssetTypes: vi.fn(),
  useCreateAssetType: vi.fn(),
  useUpdateAssetType: vi.fn(),
  useDeleteAssetType: vi.fn(),
}));

vi.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: vi.fn(() => ({ pushToast: vi.fn() })),
  },
}));

import { AssetTypesPage } from '../AssetTypesPage';
import {
  useAssetTypes,
  useCreateAssetType,
  useUpdateAssetType,
  useDeleteAssetType,
} from '@/lib/hooks';

const mockUseAssetTypes = vi.mocked(useAssetTypes);
const mockUseCreateAssetType = vi.mocked(useCreateAssetType);
const mockUseUpdateAssetType = vi.mocked(useUpdateAssetType);
const mockUseDeleteAssetType = vi.mocked(useDeleteAssetType);

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
};

// Note: at2 code intentionally differs from group to avoid getByText ambiguity
// (getByText requires a unique text match; REAL_ESTATE_ASSET code ≠ REAL_ESTATE group)
const sampleTypes = [
  { id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking Account', group: 'FINANCIAL' },
  { id: 'at2', code: 'REAL_ESTATE_ASSET', label: 'Real Estate', group: 'REAL_ESTATE' },
  { id: 'at3', code: 'VEHICLE', label: 'Vehicle', group: 'PERSONAL_PROPERTY' },
];

describe('AssetTypesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateAssetType.mockReturnValue(mockMutation as any);
    mockUseUpdateAssetType.mockReturnValue(mockMutation as any);
    mockUseDeleteAssetType.mockReturnValue(mockMutation as any);
  });

  it('shows loading when fetching', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: true, data: undefined, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    expect(screen.getByText('Could not load asset types')).toBeInTheDocument();
  });

  it('renders asset types with code, label, and group badge', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    expect(screen.getByText('CHECKING_ACCOUNT')).toBeInTheDocument();
    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('FINANCIAL')).toBeInTheDocument();
    expect(screen.getByText('REAL_ESTATE')).toBeInTheDocument();
    expect(screen.getByText('Real Estate')).toBeInTheDocument();
  });

  it('opens create dialog when Add new type is clicked', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByText('Add new type'));
    expect(screen.getByRole('heading', { name: 'Create Asset Type' })).toBeInTheDocument();
  });

  it('closes create dialog on cancel', () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByText('Add new type'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByRole('heading', { name: 'Create Asset Type' })).not.toBeInTheDocument();
  });

  it('creates an asset type on valid submit', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 'at10', code: 'CRYPTO_ETF', label: 'Crypto ETF', group: 'FINANCIAL' });
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByText('Add new type'));

    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'CRYPTO_ETF' } });
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Crypto ETF' } });

    await waitFor(() => {
      const createBtn = screen.getByText('Create');
      expect(createBtn).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CRYPTO_ETF', label: 'Crypto ETF' })
      );
    });
  });

  it('deletes an asset type when confirmed in dialog', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue(undefined);

    render(<AssetTypesPage />);
    const deleteBtn = screen.getByLabelText('Delete asset type CHECKING_ACCOUNT');
    fireEvent.click(deleteBtn);

    // Dialog should appear
    expect(screen.getByText('Delete Asset Type')).toBeInTheDocument();

    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith('at1');
    });
  });

  it('opens edit dialog when edit button is clicked', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    render(<AssetTypesPage />);
    const editBtn = screen.getByLabelText('Edit asset type CHECKING_ACCOUNT');
    await act(async () => { fireEvent.click(editBtn); });
    expect(screen.getByRole('heading', { name: 'Edit Asset Type' })).toBeInTheDocument();
  });

  it('updates an asset type on valid edit submit', async () => {
    mockUseAssetTypes.mockReturnValue({ isLoading: false, isError: false, data: sampleTypes, refetch: vi.fn() } as any);
    mockMutation.mutateAsync.mockResolvedValue({ id: 'at1', code: 'CHECKING_ACCOUNT', label: 'Checking', group: 'FINANCIAL' });
    render(<AssetTypesPage />);
    fireEvent.click(screen.getByLabelText('Edit asset type CHECKING_ACCOUNT'));

    const labelInput = screen.getByLabelText('Label');
    fireEvent.change(labelInput, { target: { value: 'Checking' } });

    await waitFor(() => {
      expect(screen.getByText('Save')).not.toBeDisabled();
    });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockMutation.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'at1', label: 'Checking' })
      );
    });
  });
});
