'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
    
    // Log to monitoring service
    if (typeof window !== 'undefined') {
      // Send error to monitoring service
      console.error('UI Error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-6">
          <div className="terminal-window border-red-500 text-red-300 max-w-2xl w-full">
            <div className="terminal-header bg-red-900/20">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <span className="text-lg font-cyber font-bold">SYSTEM ERROR</span>
              </div>
            </div>
            <div className="terminal-content space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-cyber font-bold text-red-400 mb-2">
                  Something went wrong
                </h2>
                <p className="text-red-300/80 mb-6">
                  The HexStrike AI interface encountered an unexpected error.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-900/10 border border-red-500/30 rounded p-4">
                  <h3 className="text-sm font-bold text-red-400 mb-2">Error Details:</h3>
                  <pre className="text-xs text-red-300/70 overflow-auto max-h-40">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="cyber-button bg-red-900/20 border-red-500 text-red-300 hover:bg-red-500 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="cyber-button bg-cyber-primary/20 border-cyber-primary text-cyber-primary hover:bg-cyber-primary hover:text-cyber-dark"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </button>
              </div>

              <div className="text-center text-xs text-red-300/60 font-mono">
                Error ID: {Date.now().toString(36)}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional error boundary hook for specific components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}