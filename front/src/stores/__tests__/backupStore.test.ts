import { describe, it, expect, beforeEach } from 'vitest';
import { useBackupStore } from '../backupStore';

describe('backupStore', () => {
  beforeEach(() => useBackupStore.getState().reset());

  it('starts idle', () => {
    expect(useBackupStore.getState().step).toBe('idle');
  });

  it('setParsed transitions to review with counts', () => {
    useBackupStore.getState().setParsed({
      version: '1.0',
      data: {
        portfolios: [{}, {}],
        assets: [{}],
        categories: [],
        tags: [{}],
      },
    });
    const s = useBackupStore.getState();
    expect(s.step).toBe('review');
    expect(s.counts).toEqual({ portfolios: 2, assets: 1, categories: 0, tags: 1 });
  });

  it('setError records and switches to error step', () => {
    useBackupStore.getState().setError('bad json');
    const s = useBackupStore.getState();
    expect(s.step).toBe('error');
    expect(s.errors).toEqual(['bad json']);
  });

  it('reset returns to idle', () => {
    useBackupStore.getState().setError('x');
    useBackupStore.getState().reset();
    expect(useBackupStore.getState().step).toBe('idle');
    expect(useBackupStore.getState().errors).toEqual([]);
  });
});
