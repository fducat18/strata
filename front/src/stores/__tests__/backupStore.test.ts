import { describe, it, expect, beforeEach } from 'vitest';
import { useBackupStore } from '../backupStore';

describe('backupStore', () => {
  beforeEach(() => useBackupStore.getState().reset());

  it('starts idle', () => {
    expect(useBackupStore.getState().step).toBe('idle');
  });

  it('setParsed transitions to review with counts', () => {
    useBackupStore.getState().setParsed({
      schemaVersion: '1',
      data: {
        assets: [{}],
        categories: [],
        tags: [{}],
      },
    });
    const s = useBackupStore.getState();
    expect(s.step).toBe('review');
    expect(s.counts).toEqual({ assets: 1, categories: 0, tags: 1 });
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

  it('startParse transitions to parsing', () => {
    useBackupStore.getState().startParse();
    const s = useBackupStore.getState();
    expect(s.step).toBe('parsing');
    expect(s.errors).toEqual([]);
    expect(s.parsed).toBeNull();
  });

  it('startConfirming transitions to confirming', () => {
    useBackupStore.getState().setParsed({ schemaVersion: '1', data: {} });
    useBackupStore.getState().startConfirming();
    expect(useBackupStore.getState().step).toBe('confirming');
  });

  it('setDone transitions to done', () => {
    useBackupStore.getState().setDone();
    expect(useBackupStore.getState().step).toBe('done');
  });

  it('countsOf handles missing arrays in payload', () => {
    useBackupStore.getState().setParsed({ schemaVersion: '1', data: {} });
    const s = useBackupStore.getState();
    expect(s.counts).toEqual({ assets: 0, categories: 0, tags: 0 });
  });
});
