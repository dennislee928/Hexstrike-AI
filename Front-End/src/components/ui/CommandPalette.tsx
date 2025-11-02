'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Command, ArrowRight, Hash, Zap, Settings, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  title: string;
  description?: string;
  category: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Define available commands
  const commands: Command[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      category: 'Navigation',
      icon: <Hash size={16} />,
      action: () => {
        router.push('/');
        onClose();
      },
      keywords: ['dashboard', 'home', 'main']
    },
    {
      id: 'nav-tools',
      title: 'Go to Tools',
      description: 'Browse all security tools',
      category: 'Navigation',
      icon: <Zap size={16} />,
      action: () => {
        router.push('/tools');
        onClose();
      },
      keywords: ['tools', 'security', 'browse']
    },
    {
      id: 'nav-network',
      title: 'Network Tools',
      description: 'Network scanning and reconnaissance',
      category: 'Tools',
      icon: <Zap size={16} />,
      action: () => {
        router.push('/tools/network');
        onClose();
      },
      keywords: ['network', 'nmap', 'scan', 'recon']
    },
    {
      id: 'nav-web',
      title: 'Web Application Tools',
      description: 'Web application security testing',
      category: 'Tools',
      icon: <Zap size={16} />,
      action: () => {
        router.push('/tools/web');
        onClose();
      },
      keywords: ['web', 'webapp', 'gobuster', 'nuclei', 'burp']
    },
    {
      id: 'nav-binary',
      title: 'Binary Analysis Tools',
      description: 'Binary analysis and reverse engineering',
      category: 'Tools',
      icon: <Zap size={16} />,
      action: () => {
        router.push('/tools/binary');
        onClose();
      },
      keywords: ['binary', 'reverse', 'ghidra', 'radare2', 'analysis']
    },
    {
      id: 'nav-cloud',
      title: 'Cloud Security Tools',
      description: 'Cloud infrastructure security',
      category: 'Tools',
      icon: <Zap size={16} />,
      action: () => {
        router.push('/tools/cloud');
        onClose();
      },
      keywords: ['cloud', 'aws', 'azure', 'gcp', 'prowler']
    },
    {
      id: 'nav-forensics',
      title: 'Forensics Tools',
      description: 'Digital forensics and incident response',
      category: 'Tools',
      icon: <Zap size={16} />,
      action: () => {
        router.push('/tools/forensics');
        onClose();
      },
      keywords: ['forensics', 'volatility', 'memory', 'disk', 'analysis']
    },
    // Actions
    {
      id: 'action-new-scan',
      title: 'Start New Scan',
      description: 'Begin a new security scan',
      category: 'Actions',
      icon: <Zap size={16} />,
      action: () => {
        const event = new CustomEvent('new-scan');
        window.dispatchEvent(event);
        onClose();
      },
      keywords: ['scan', 'new', 'start', 'begin']
    },
    {
      id: 'action-refresh',
      title: 'Refresh Page',
      description: 'Reload the current page',
      category: 'Actions',
      icon: <ArrowRight size={16} />,
      action: () => {
        window.location.reload();
      },
      keywords: ['refresh', 'reload', 'update']
    },
    // Settings
    {
      id: 'settings-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark theme',
      category: 'Settings',
      icon: <Settings size={16} />,
      action: () => {
        const event = new CustomEvent('toggle-theme');
        window.dispatchEvent(event);
        onClose();
      },
      keywords: ['theme', 'dark', 'light', 'appearance']
    },
    // Help
    {
      id: 'help-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      category: 'Help',
      icon: <HelpCircle size={16} />,
      action: () => {
        const event = new CustomEvent('show-shortcuts-help');
        window.dispatchEvent(event);
        onClose();
      },
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'help']
    }
  ], [router, onClose]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter(command => {
      const searchText = [
        command.title,
        command.description || '',
        command.category,
        ...(command.keywords || [])
      ].join(' ').toLowerCase();

      return searchText.includes(lowerQuery);
    });
  }, [commands, query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none"
          />
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
            <span>select</span>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No commands found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
                  {category}
                </div>
                {categoryCommands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={command.id}
                      onClick={command.action}
                      className={`
                        w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                        ${isSelected ? 'bg-green-50 dark:bg-green-900/20 border-r-2 border-green-500' : ''}
                      `}
                    >
                      {command.icon && (
                        <div className={`
                          flex-shrink-0 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}
                        `}>
                          {command.icon}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`
                          font-medium ${isSelected ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-gray-100'}
                        `}>
                          {command.title}
                        </div>
                        {command.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {command.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight className={`
                        w-4 h-4 flex-shrink-0 ${isSelected ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}
                      `} />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Command size={12} />
              <span>Command Palette</span>
            </div>
            <div>
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}