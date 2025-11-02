'use client'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'accent' | 'white'
  className?: string
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6', 
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const colorClasses = {
  primary: 'border-cyber-primary',
  secondary: 'border-neon-blue',
  accent: 'border-neon-pink',
  white: 'border-white'
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  className,
  text 
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-transparent border-t-current',
          sizeClasses[size],
          colorClasses[color]
        )}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <span className="text-sm text-cyber-light font-mono animate-pulse">
          {text}
        </span>
      )}
    </div>
  )
}

// Skeleton loader for content
export function SkeletonLoader({ 
  lines = 3, 
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-cyber-gray rounded animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('terminal-window animate-pulse', className)}>
      <div className="terminal-header">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 bg-cyber-gray rounded" />
          <div className="h-4 w-32 bg-cyber-gray rounded" />
        </div>
      </div>
      <div className="terminal-content space-y-4">
        <SkeletonLoader lines={2} />
        <div className="flex justify-between items-center pt-2 border-t border-cyber-primary/30">
          <div className="h-3 w-24 bg-cyber-gray rounded" />
          <div className="h-3 w-16 bg-cyber-gray rounded" />
        </div>
      </div>
    </div>
  )
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-cyber-gray rounded animate-pulse" />
          <div className="h-4 w-64 bg-cyber-gray rounded animate-pulse" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-6 w-24 bg-cyber-gray rounded animate-pulse" />
          <div className="h-12 w-12 bg-cyber-gray rounded-full animate-pulse" />
        </div>
      </div>

      {/* Status cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-96" />
        </div>
        <div className="space-y-6">
          <CardSkeleton className="h-48" />
          <CardSkeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

// Tool grid skeleton
export function ToolGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}