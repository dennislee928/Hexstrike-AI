'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from './ui/CommandPalette';
import { LazyWrapper } from './LazyComponents';

export function GlobalKeyboardShortcuts() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Register global shortcuts
  useGlobalShortcuts();

  // Listen for global events
  useEffect(() => {
    const handleOpenCommandPalette = () => setShowCommandPalette(true);
    const handleShowShortcutsHelp = () => setShowShortcutsHelp(true);
    const handleGlobalEscape = () => {
      setShowCommandPalette(false);
      setShowShortcutsHelp(false);
    };

    window.addEventListener('open-command-palette', handleOpenCommandPalette);
    window.addEventListener('show-shortcuts-help', handleShowShortcutsHelp);
    window.addEventListener('global-escape', handleGlobalEscape);

    return () => {
      window.removeEventListener('open-command-palette', handleOpenCommandPalette);
      window.removeEventListener('show-shortcuts-help', handleShowShortcutsHelp);
      window.removeEventListener('global-escape', handleGlobalEscape);
    };
  }, []);

  return (
    <>
      {/* Command Palette */}
      <LazyWrapper>
        <CommandPalette 
          isOpen={showCommandPalette} 
          onClose={() => setShowCommandPalette(false)} 
        />
      </LazyWrapper>

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Keyboard Shortcuts
              </h2>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Navigation</h3>
                  <div className="space-y-2">
                    <ShortcutItem keys={['Ctrl', 'K']} description="Open command palette" />
                    <ShortcutItem keys={['Ctrl', '/']} description="Focus search" />
                    <ShortcutItem keys={['Ctrl', 'D']} description="Go to dashboard" />
                    <ShortcutItem keys={['Ctrl', 'T']} description="Go to tools" />
                    <ShortcutItem keys={['Esc']} description="Close modals" />
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Actions</h3>
                  <div className="space-y-2">
                    <ShortcutItem keys={['Ctrl', 'N']} description="Start new scan" />
                    <ShortcutItem keys={['Ctrl', 'R']} description="Refresh page" />
                    <ShortcutItem keys={['Ctrl', 'Enter']} description="Submit form" />
                    <ShortcutItem keys={['Ctrl', '?']} description="Show shortcuts" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowShortcutsHelp(false)}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{description}</span>
      <div className="flex items-center space-x-1">
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            {index > 0 && <span className="text-gray-400">+</span>}
            <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
              {key}
            </kbd>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}