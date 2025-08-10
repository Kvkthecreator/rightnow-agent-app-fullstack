/**
 * Centralized API client - ONE source of truth for ALL API calls
 * No more scattered fetch() calls across components
 */

import { BasketChangeRequest, BasketDelta } from '@shared/contracts/basket'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://rightnow-api.onrender.com'

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Basket operations
  async processBasketWork(basketId: string, request: BasketChangeRequest): Promise<BasketDelta> {
    return this.request(`/api/baskets/${basketId}/work`, {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getBasketDeltas(basketId: string): Promise<BasketDelta[]> {
    return this.request(`/api/baskets/${basketId}/deltas`)
  }

  async applyBasketDelta(basketId: string, deltaId: string): Promise<{ status: string; basket_id: string; delta_id: string }> {
    return this.request(`/api/baskets/${basketId}/apply/${deltaId}`, {
      method: 'POST',
    })
  }
}

// Singleton instance
export const apiClient = new ApiClient()

// Helper functions for direct usage
export const basketApi = {
  processWork: (basketId: string, request: BasketChangeRequest) =>
    apiClient.processBasketWork(basketId, request),
  
  getDeltas: (basketId: string) =>
    apiClient.getBasketDeltas(basketId),
  
  applyDelta: (basketId: string, deltaId: string) =>
    apiClient.applyBasketDelta(basketId, deltaId),
}