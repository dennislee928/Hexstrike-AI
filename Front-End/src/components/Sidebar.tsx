'use client'

import { useState, useEffect } from 'react'
import { 
  Home, 
  Activity, 
  Shield, 
  Zap, 
  Settings, 
  Network,
  Globe,
  Binary,
  Cloud,
  Search,
  Target,
  Brain,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
  children?: SidebarItem[]
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const [pathname, setPathname] = useState('/')
  const [expandedItems, setExpandedItems] = useState<string[]>(['tools'])

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);
  const [systemStats, setSystemStats] = useState({
    cpu: 23,
    memory: 67,
    activeScans: 3,
    uptime: '2d 14h'
  })

  const sidebarItems: SidebarItem[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <Home className="w-5 h-5" />, 
      href: '/' 
    },
    { 
      id: 'activity', 
      label: 'Activity Monitor', 
      icon: <Activity className="w-5 h-5" />, 
      href: '/activity',
      badge: systemStats.activeScans
    },
    {
      id: 'tools',
      label: 'Security Tools',
      icon: <Shield className="w-5 h-5" />,
      href: '/tools',
      children: [
        { 
          id: 'network', 
          label: 'Network Tools', 
          icon: <Network className="w-4 h-4" />, 
          href: '/tools/network' 
        },
        { 
          id: 'web', 
          label: 'Web Application', 
          icon: <Globe className="w-4 h-4" />, 
          href: '/tools/web' 
        },
        { 
          id: 'binary', 
          label: 'Binary Analysis', 
          icon: <Binary className="w-4 h-4" />, 
          href: '/tools/binary' 
        },
        { 
          id: 'cloud', 
          label: 'Cloud Security', 
          icon: <Cloud className="w-4 h-4" />, 
          href: '/tools/cloud' 
        },
        { 
          id: 'forensics', 
          label: 'Digital Forensics', 
          icon: <Search className="w-4 h-4" />, 
          href: '/tools/forensics' 
        }
      ]
    },
    { 
      id: 'intelligence', 
      label: 'AI Intelligence', 
      icon: <Brain className="w-5 h-5" />, 
      href: '/intelligence' 
    },
    { 
      id: 'targets', 
      label: 'Target Management', 
      icon: <Target className="w-5 h-5" />, 
      href: '/targets' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <Settings className="w-5 h-5" />, 
      href: '/settings' 
    }
  ]

  // Update system stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 40) + 10,
        memory: Math.floor(Math.random() * 30) + 50
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const active = isActive(item.href)
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)

    return (
      <li key={item.id}>
        <div className="relative">
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(item.id)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200
                ${level > 0 ? 'ml-4' : ''}
                ${active 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-r-2 border-green-500' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <span className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                    {item.badge}
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </button>
          ) : (
            <a
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200
                ${level > 0 ? 'ml-4' : ''}
                ${active 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-r-2 border-green-500' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <span className={active ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                  {item.badge}
                </span>
              )}
            </a>
          )}
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <aside className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">HexStrike AI</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">v2.0.0</p>
            </div>
          </div>
          
          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </ul>
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              System Status
            </h3>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${systemStats.cpu}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-8">
                  {systemStats.cpu}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Memory</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${systemStats.memory}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-8">
                  {systemStats.memory}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Active Scans</span>
              <span className="text-xs font-mono text-green-600 dark:text-green-400">
                {systemStats.activeScans}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Uptime</span>
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                {systemStats.uptime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
