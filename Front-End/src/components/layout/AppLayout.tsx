'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { GlobalKeyboardShortcuts } from '@/components/GlobalKeyboardShortcuts';
import { useTheme } from '@/contexts/ThemeContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Handle initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            Loading HexStrike AI...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Global Components */}
      <GlobalKeyboardShortcuts />

      {/* Cyberpunk Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Scan line effect */}
        <div className="scan-line opacity-20 dark:opacity-30" />

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Layout */}
      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Sidebar Overlay (Mobile) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          {/* Header */}
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
            <Header onMenuClick={() => setSidebarOpen(true)} />
          </div>

          {/* Page Content */}
          <main className="flex-1 relative">
            {/* Content Container */}
            <div className="h-full">
              {/* Page Wrapper */}
              <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
                {/* Content Area */}
                <div className="relative">
                  {/* Page Content */}
                  <div className="pb-16 lg:pb-0">
                    {children}
                  </div>

                  {/* Floating Action Button (Mobile) */}
                  <div className="fixed bottom-20 right-4 z-20 lg:hidden">
                    <button
                      onClick={() => {
                        const event = new CustomEvent('new-scan');
                        window.dispatchEvent(event);
                      }}
                      className="
                        w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg
                        flex items-center justify-center transition-all duration-200 hover:scale-110
                        focus:outline-none focus:ring-4 focus:ring-green-500/30
                      "
                      aria-label="Start new scan"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Status Indicator */}
      <div className="fixed bottom-4 left-4 z-10 hidden lg:block">
        <div className="flex items-center space-x-2 px-3 py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            System Online
          </span>
        </div>
      </div>
    </div>
  );
}