import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { useCalendarMarkdown as UseCalendarMarkdown } from '../../composables/useCalendarMarkdown';

// Helper to reset internal module state between tests by re-importing.
const reloadComposable = async () => {
  const mod = await import('../../composables/useCalendarMarkdown');

  return mod.useCalendarMarkdown as unknown as typeof UseCalendarMarkdown;
};

describe('useCalendarMarkdown composable', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('fetches markdown once and caches subsequent calls', async () => {
    const mockData = '# Calendar Data';
    const fetchSpy = vi.fn().mockResolvedValue({
      data: { value: mockData },
      error: { value: null }
    });

    vi.stubGlobal('useFetch', fetchSpy as unknown);

    const composable = await reloadComposable();
    const first = await composable();
    const second = await composable();

    expect(first).toBe(mockData);
    expect(second).toBe(mockData);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('propagates errors from fetch', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: { value: null },
      error: { value: { message: 'Network fail' } }
    });

    vi.stubGlobal('useFetch', fetchSpy as unknown);

    const composable = await reloadComposable();

  await expect(composable()).rejects.toThrow('Network fail');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('handles empty success response', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      data: { value: '' },
      error: { value: null }
    });

    vi.stubGlobal('useFetch', fetchSpy as unknown);

    const composable = await reloadComposable();
    const result = await composable();

    expect(result).toBe('');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
