'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category?: string;
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true
  } = options;

  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow Escape key to work in inputs
      if (event.key !== 'Escape') {
        return;
      }
    }

    const matchingShortcut = shortcutsRef.current.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      if (preventDefault) {
        event.preventDefault();
      }
      if (stopPropagation) {
        event.stopPropagation();
      }
      matchingShortcut.action();
    }
  }, [enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcutsRef.current;
}

// Global keyboard shortcuts for the application
export function useGlobalShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      action: () => {
        // Open command palette
        const event = new CustomEvent('open-command-palette');
        window.dispatchEvent(event);
      },
      description: 'Open command palette',
      category: 'Navigation'
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        // Focus search
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Focus search',
      category: 'Navigation'
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, clear focus
        const event = new CustomEvent('global-escape');
        window.dispatchEvent(event);
        
        // Remove focus from active element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      },
      description: 'Close modals and clear focus',
      category: 'Navigation'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        // New scan/tool execution
        const event = new CustomEvent('new-scan');
        window.dispatchEvent(event);
      },
      description: 'Start new scan',
      category: 'Actions'
    },
    {
      key: 'r',
      ctrlKey: true,
      action: () => {
        // Refresh current view
        window.location.reload();
      },
      description: 'Refresh page',
      category: 'Actions'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => {
        // Go to dashboard
        window.location.href = '/';
      },
      description: 'Go to dashboard',
      category: 'Navigation'
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => {
        // Go to tools
        window.location.href = '/tools';
      },
      description: 'Go to tools',
      category: 'Navigation'
    },
    {
      key: '?',
      ctrlKey: true,
      action: () => {
        // Show keyboard shortcuts help
        const event = new CustomEvent('show-shortcuts-help');
        window.dispatchEvent(event);
      },
      description: 'Show keyboard shortcuts',
      category: 'Help'
    }
  ];

  return useKeyboardShortcuts(shortcuts);
}

// Hook for managing modal keyboard shortcuts
export function useModalShortcuts(isOpen: boolean, onClose: () => void) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      action: onClose,
      description: 'Close modal',
      category: 'Modal'
    }
  ];

  return useKeyboardShortcuts(shortcuts, { enabled: isOpen });
}

// Hook for managing form keyboard shortcuts
export function useFormShortcuts(onSubmit: () => void, onCancel?: () => void) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Enter',
      ctrlKey: true,
      action: onSubmit,
      description: 'Submit form',
      category: 'Form'
    }
  ];

  if (onCancel) {
    shortcuts.push({
      key: 'Escape',
      action: onCancel,
      description: 'Cancel form',
      category: 'Form'
    });
  }

  return useKeyboardShortcuts(shortcuts);
}