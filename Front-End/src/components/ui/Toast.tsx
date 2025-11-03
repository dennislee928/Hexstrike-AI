'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration ?? (toast.type === 'error' ? 8000 : 5000)
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const colors = {
    success: 'border-green-500 bg-green-900/20 text-green-300',
    error: 'border-red-500 bg-red-900/20 text-red-300',
    warning: 'border-yellow-500 bg-yellow-900/20 text-yellow-300',
    info: 'border-blue-500 bg-blue-900/20 text-blue-300'
  }

  const Icon = icons[toast.type]

  return (
    <div
      className={cn(
        'border rounded-lg p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-full',
        colors[toast.type]
      )}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="text-sm font-medium mb-1">{toast.title}</h4>
          )}
          <p className="text-sm opacity-90">{toast.message}</p>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-xs underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Convenience hooks for different toast types
export function useToastActions() {
  const { addToast } = useToast()

  return {
    success: (message: string, title?: string) =>
      addToast({ type: 'success', message, title }),
    
    error: (message: string, title?: string) =>
      addToast({ type: 'error', message, title }),
    
    warning: (message: string, title?: string) =>
      addToast({ type: 'warning', message, title }),
    
    info: (message: string, title?: string) =>
      addToast({ type: 'info', message, title }),
    
    promise: async <T,>(
      promise: Promise<T>,
      options: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ) => {
      const { loading, success, error } = options
      addToast({ type: 'info', message: loading, duration: Infinity })
      
      try {
        const result = await promise
        const successMessage = typeof success === 'function' ? success(result) : success
        addToast({ type: 'success', message: successMessage })
        return result
      } catch (err) {
        const errorMessage = typeof error === 'function' ? error(err) : error
        addToast({ type: 'error', message: errorMessage })
        throw err
      }
    }
  }
}