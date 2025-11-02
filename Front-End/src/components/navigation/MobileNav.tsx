'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Zap, 
  Activity, 
  Settings, 
  Shield, 
  Network, 
  Globe, 
  Binary,
  Cloud,
  Search
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export function MobileNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: '/',
      icon: <Home size={20} />,
      label: 'Dashboard'
    },
    {
      href: '/tools',
      icon: <Zap size={20} />,
      label: 'Tools'
    },
    {
      href: '/activity',
      icon: <Activity size={20} />,
      label: 'Activity'
    },
    {
      href: '/settings',
      icon: <Settings size={20} />,
      label: 'Settings'
    }
  ];

  return (
    <nav className="mobile-nav md:hidden">
      <div className="mobile-nav-grid">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon">
                {item.icon}
              </div>
              <span className="mobile-nav-label">
                {item.label}
              </span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileToolNav() {
  const pathname = usePathname();

  const toolCategories = [
    {
      href: '/tools/network',
      icon: <Network size={18} />,
      label: 'Network',
      color: 'text-blue-600'
    },
    {
      href: '/tools/web',
      icon: <Globe size={18} />,
      label: 'Web',
      color: 'text-green-600'
    },
    {
      href: '/tools/binary',
      icon: <Binary size={18} />,
      label: 'Binary',
      color: 'text-purple-600'
    },
    {
      href: '/tools/cloud',
      icon: <Cloud size={18} />,
      label: 'Cloud',
      color: 'text-orange-600'
    },
    {
      href: '/tools/forensics',
      icon: <Search size={18} />,
      label: 'Forensics',
      color: 'text-red-600'
    }
  ];

  return (
    <div className="flex overflow-x-auto space-x-2 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:hidden">
      {toolCategories.map((category) => {
        const isActive = pathname === category.href;
        
        return (
          <Link
            key={category.href}
            href={category.href}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200
              ${isActive 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            <span className={isActive ? 'text-green-600 dark:text-green-400' : category.color}>
              {category.icon}
            </span>
            <span className="text-sm font-medium">
              {category.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const sidebarItems = [
    {
      href: '/',
      icon: <Home size={20} />,
      label: 'Dashboard'
    },
    {
      href: '/tools',
      icon: <Zap size={20} />,
      label: 'All Tools'
    },
    {
      href: '/tools/network',
      icon: <Network size={20} />,
      label: 'Network Tools'
    },
    {
      href: '/tools/web',
      icon: <Globe size={20} />,
      label: 'Web Tools'
    },
    {
      href: '/tools/binary',
      icon: <Binary size={20} />,
      label: 'Binary Analysis'
    },
    {
      href: '/tools/cloud',
      icon: <Cloud size={20} />,
      label: 'Cloud Security'
    },
    {
      href: '/tools/forensics',
      icon: <Search size={20} />,
      label: 'Forensics'
    },
    {
      href: '/activity',
      icon: <Activity size={20} />,
      label: 'Activity Monitor'
    },
    {
      href: '/settings',
      icon: <Settings size={20} />,
      label: 'Settings'
    }
  ];

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''} dark:bg-gray-900 dark:border-gray-700`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">HexStrike AI</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Security Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-r-2 border-green-500' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <span className={isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  {item.icon}
                </span>
                <span className="font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Version 2.0.0
          </div>
        </div>
      </div>
    </>
  );
}