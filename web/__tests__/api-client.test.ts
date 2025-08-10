import { ApiClient, basketApi } from '@/lib/api/client';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('basket operations', () => {
    test('processBasketWork sends correct request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          delta_id: 'delta-123',
          basket_id: 'basket-1',
          summary: 'Test delta'
        })
      } as Response);

      const result = await basketApi.processWork('basket-1', {
        basket_id: 'basket-1',
        intent: 'test intent',
        request_id: 'req-123'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/baskets/basket-1/work'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test intent')
        })
      );

      expect(result.delta_id).toBe('delta-123');
    });

    test('getDeltas retrieves basket deltas', async () => {
      const mockDeltas = [
        { delta_id: 'delta-1', summary: 'First delta' },
        { delta_id: 'delta-2', summary: 'Second delta' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDeltas
      } as Response);

      const result = await basketApi.getDeltas('basket-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/baskets/basket-1/deltas'),
        expect.objectContaining({ method: undefined }) // GET is default
      );

      expect(result).toEqual(mockDeltas);
    });

    test('applyDelta applies specific delta', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'applied',
          basket_id: 'basket-1',
          delta_id: 'delta-123'
        })
      } as Response);

      const result = await basketApi.applyDelta('basket-1', 'delta-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/baskets/basket-1/apply/delta-123'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(result.status).toBe('applied');
    });

    test('handles API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      } as Response);

      await expect(basketApi.processWork('basket-1', {
        basket_id: 'basket-1',
        intent: 'test'
      })).rejects.toThrow('API Error: 500 Internal Server Error');
    });

    test('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(basketApi.getDeltas('basket-1')).rejects.toThrow('Network error');
    });
  });

  describe('ApiClient class', () => {
    test('can be instantiated with custom base URL', () => {
      const client = new ApiClient('https://custom.api.com');
      expect(client).toBeInstanceOf(ApiClient);
    });

    test('adds correct headers to requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

      const client = new ApiClient();
      await client.request('/test', { method: 'POST' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });
});