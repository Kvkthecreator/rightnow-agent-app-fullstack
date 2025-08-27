import { renderHook, act } from '@testing-library/react';
import { useBasketOperations } from '@/hooks/useBasketOperations';
import { basketApi } from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  basketApi: {
    processWork: jest.fn(),
    getDeltas: jest.fn(),
    applyDelta: jest.fn()
  }
}));

const mockBasketApi = basketApi as jest.Mocked<typeof basketApi>;

describe('useBasketOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial state is correct', () => {
    const { result } = renderHook(() => useBasketOperations());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.processWork).toBe('function');
    expect(typeof result.current.getDeltas).toBe('function');
    expect(typeof result.current.applyDelta).toBe('function');
  });

  test('processWork success updates state correctly', async () => {
    const mockDelta = {
      delta_id: 'delta-123',
      basket_id: 'basket-1',
      summary: 'Test delta',
      changes: [],
      confidence: 0.9,
      created_at: '2024-01-01T00:00:00Z'
    };

    mockBasketApi.processWork.mockResolvedValueOnce(mockDelta);

    const { result } = renderHook(() => useBasketOperations());

    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      const delta = await result.current.processWork('basket-1', {
        basket_id: 'basket-1',
        intent: 'test intent'
      });
      expect(delta).toEqual(mockDelta);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  test('processWork handles errors correctly', async () => {
    const errorMessage = 'API Error: 500 Internal Server Error';
    mockBasketApi.processWork.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useBasketOperations());

    await act(async () => {
      const delta = await result.current.processWork('basket-1', {
        basket_id: 'basket-1',
        intent: 'test'
      });
      expect(delta).toBe(null);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.isLoading).toBe(false);
  });

  test('getDeltas success returns deltas', async () => {
    const mockDeltas = [
      { delta_id: 'delta-1', summary: 'First delta' },
      { delta_id: 'delta-2', summary: 'Second delta' }
    ];

    mockBasketApi.getDeltas.mockResolvedValueOnce(mockDeltas);

    const { result } = renderHook(() => useBasketOperations());

    await act(async () => {
      const deltas = await result.current.getDeltas('basket-1');
      expect(deltas).toEqual(mockDeltas);
    });

    expect(result.current.error).toBe(null);
  });

  test('getDeltas handles errors', async () => {
    mockBasketApi.getDeltas.mockRejectedValueOnce(new Error('Failed to get deltas'));

    const { result } = renderHook(() => useBasketOperations());

    await act(async () => {
      const deltas = await result.current.getDeltas('basket-1');
      expect(deltas).toBe(null);
    });

    expect(result.current.error).toBe('Failed to get deltas');
  });

  test('applyDelta success returns true', async () => {
    mockBasketApi.applyDelta.mockResolvedValueOnce({
      status: 'applied',
      basket_id: 'basket-1',
      delta_id: 'delta-123'
    });

    const { result } = renderHook(() => useBasketOperations());

    await act(async () => {
      const success = await result.current.applyDelta('basket-1', 'delta-123');
      expect(success).toBe(true);
    });

    expect(result.current.error).toBe(null);
  });

  test('applyDelta handles errors', async () => {
    mockBasketApi.applyDelta.mockRejectedValueOnce(new Error('Failed to apply delta'));

    const { result } = renderHook(() => useBasketOperations());

    await act(async () => {
      const success = await result.current.applyDelta('basket-1', 'delta-123');
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe('Failed to apply delta');
  });

  test('clearError resets error state', async () => {
    mockBasketApi.processWork.mockRejectedValueOnce(new Error('Test error'));

    const { result } = renderHook(() => useBasketOperations());

    // Create an error
    await act(async () => {
      await result.current.processWork('basket-1', {
        basket_id: 'basket-1',
        intent: 'test'
      });
    });

    expect(result.current.error).toBe('Test error');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  test('sets loading state during operations', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const controlledPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockBasketApi.processWork.mockReturnValueOnce(controlledPromise as any);

    const { result } = renderHook(() => useBasketOperations());

    expect(result.current.isLoading).toBe(false);

    // Start the operation
    act(() => {
      result.current.processWork('basket-1', {
        basket_id: 'basket-1',
        intent: 'test'
      });
    });

    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ delta_id: 'test' });
    });

    expect(result.current.isLoading).toBe(false);
  });
});