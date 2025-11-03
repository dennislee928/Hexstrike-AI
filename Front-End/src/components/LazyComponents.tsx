'use client';

import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

// Lazy load tool pages for better performance (only load existing pages)
export const NetworkToolsPage = lazy(() => import('../app/tools/network/page'));
export const WebToolsPage = lazy(() => import('../app/tools/web/page'));
export const BinaryToolsPage = lazy(() => import('../app/tools/binary/page'));
export const CloudToolsPage = lazy(() => import('../app/tools/cloud/page'));
export const ForensicsToolsPage = lazy(() => import('../app/tools/forensics/page'));
export const ExploitationToolsPage = lazy(() => import('../app/tools/exploitation/page'));
export const AuthToolsPage = lazy(() => import('../app/tools/auth/page'));

// Lazy load heavy components
export const AdvancedSearch = lazy(() => 
  import('./search/AdvancedSearch').then(module => ({ default: module.AdvancedSearch }))
);
export const CommandPalette = lazy(() => 
  import('./ui/CommandPalette').then(module => ({ default: module.CommandPalette }))
);
export const VirtualizedToolList = lazy(() => 
  import('./VirtualizedToolList').then(module => ({ default: module.VirtualizedToolList }))
);

// Lazy load dashboard components
export const SystemMetrics = lazy(() => 
  import('./SystemMetrics').then(module => ({ default: module.SystemMetrics }))
);
export const ProcessMonitor = lazy(() => 
  import('./ProcessMonitor').then(module => ({ default: module.ProcessMonitor }))
);
export const RecentActivity = lazy(() => 
  import('./RecentActivity').then(module => ({ default: module.RecentActivity }))
);

// Loading fallback components
export function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-gray-600 dark:text-gray-400">
          Loading page...
        </div>
      </div>
    </div>
  );
}

export function ComponentLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-2">
        <LoadingSpinner />
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Loading component...
        </div>
      </div>
    </div>
  );
}

export function ToolListLoadingFallback() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
            </div>
            <div className="flex space-x-2 mt-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Higher-order component for lazy loading with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LazyWrapper({ 
  children, 
  fallback = <ComponentLoadingFallback />,
  errorFallback = <div className="text-red-500 p-4">Failed to load component</div>
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <ErrorBoundary fallback={errorFallback}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}

// Simple error boundary for lazy components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Preload functions for better UX
export const preloadNetworkTools = () => import('../app/tools/network/page');
export const preloadWebTools = () => import('../app/tools/web/page');
export const preloadBinaryTools = () => import('../app/tools/binary/page');
export const preloadCloudTools = () => import('../app/tools/cloud/page');
export const preloadForensicsTools = () => import('../app/tools/forensics/page');

// Hook for preloading components on hover
export function usePreloadOnHover() {
  const preloadOnHover = (preloadFn: () => Promise<any>) => {
    return {
      onMouseEnter: () => {
        preloadFn().catch(console.error);
      }
    };
  };

  return { preloadOnHover };
}