'use client'

import { useState, useCallback } from 'react'

export interface ApiState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

export interface ApiStateActions<T = any> {
  setLoading: (loading: boolean) => void
  setData: (data: T) => void
  setError: (error: string | null) => void
  setSuccess: (success: boolean) => void
  reset: () => void
  execute: (asyncFn: () => Promise<T>) => Promise<T | null>
}

export const useApiState = <T = any>(
  initialData: T | null = null
): [ApiState<T>, ApiStateActions<T>] => {
  const [state, setState] = useState<ApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false
  })

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }))
  }, [])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, loading: false, error: null, success: true }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false, success: false }))
  }, [])

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, success }))
  }, [])

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false
    })
  }, [initialData])

  const execute = useCallback(async (asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true)
      const result = await asyncFn()
      setData(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      return null
    }
  }, [setLoading, setData, setError])

  const actions: ApiStateActions<T> = {
    setLoading,
    setData,
    setError,
    setSuccess,
    reset,
    execute
  }

  return [state, actions]
}

// Hook for handling multiple API states
export const useMultipleApiStates = <T extends Record<string, any>>(
  keys: (keyof T)[]
): Record<keyof T, [ApiState, ApiStateActions]> => {
  const states = {} as Record<keyof T, [ApiState, ApiStateActions]>
  
  keys.forEach(key => {
    states[key] = useApiState()
  })
  
  return states
}

// Hook for optimistic updates
export const useOptimisticState = <T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) => {
  const [state, actions] = useApiState<T>(initialData)
  const [optimisticData, setOptimisticData] = useState<T>(initialData)

  const updateOptimistically = useCallback(async (newData: T) => {
    // Immediately update UI
    setOptimisticData(newData)
    
    try {
      // Perform actual update
      const result = await updateFn(newData)
      actions.setData(result)
      setOptimisticData(result)
      return result
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticData(state.data || initialData)
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      actions.setError(errorMessage)
      throw error
    }
  }, [updateFn, state.data, initialData, actions])

  return {
    ...state,
    data: optimisticData,
    updateOptimistically
  }
}