/**
 * Missing operational hook - handles all basket operations
 * Centralized state management for basket actions
 */

import { useState } from 'react'
import { processBasketWork, listDeltas, applyBasketDelta } from '@/lib/api/baskets'
import { BasketChangeRequest } from '@shared/contracts/basket'

interface UseBasketOperationsReturn {
  isLoading: boolean
  error: string | null
  processWork: (request: BasketChangeRequest) => Promise<any | null>
  getDeltas: () => Promise<any[] | null>
  applyDelta: (deltaId: string) => Promise<boolean>
  clearError: () => void
}

export function useBasketOperations(basketId: string): UseBasketOperationsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const processWork = async (request: BasketChangeRequest): Promise<any | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const delta = await processBasketWork(basketId, request as any)
      return delta
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process work'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const getDeltas = async (): Promise<any[] | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const deltas = await listDeltas(basketId)
      return deltas
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get deltas'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const applyDelta = async (deltaId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      await applyBasketDelta(basketId, deltaId)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply delta'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    processWork,
    getDeltas,
    applyDelta,
    clearError,
  }
}