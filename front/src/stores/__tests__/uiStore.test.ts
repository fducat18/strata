import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '../uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.setState({ openDialogs: {}, selectedIds: {}, toasts: [] });
  });

  it('opens and closes dialogs', () => {
    const { openDialog, closeDialog, isDialogOpen } = useUIStore.getState();
    openDialog('create-asset');
    expect(isDialogOpen('create-asset')).toBe(true);
    closeDialog('create-asset');
    expect(useUIStore.getState().isDialogOpen('create-asset')).toBe(false);
  });

  it('tracks selected entity ids', () => {
    useUIStore.getState().setSelectedId('portfolio', 'p1');
    expect(useUIStore.getState().getSelectedId('portfolio')).toBe('p1');
  });

  it('pushes and dismisses toasts', () => {
    useUIStore.getState().pushToast({ message: 'hi', variant: 'info' });
    const toasts = useUIStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    useUIStore.getState().dismissToast(toasts[0].id);
    expect(useUIStore.getState().toasts).toHaveLength(0);
  });
});
