'use client'

import { useState, useEffect } from 'react'
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  User, 
  Shield, 
  Activity,
  Wifi,
  WifiOff,
  Command,
  Sun,
  Moon
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggleButton } from '@/components/ui/ThemeToggle'

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [notifications, setNotifications] = useState(3)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { resolvedTheme } = useTheme()

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const openCommandPalette = () => {
    const event = new CustomEvent('open-command-palette')
    window.dispatchEvent(event)
  }

  return (
    <header className="h-16 px-4 lg:px-6 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
          
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              HexStrike AI
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              v2.0.0 • Security Platform
            </p>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <button
          onClick={openCommandPalette}
          className="
            w-full flex items-center space-x-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 
            rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors
            text-left text-gray-500 dark:text-gray-400
          "
        >
          <Search className="w-4 h-4" />
          <span className="flex-1 text-sm">Search tools, commands...</span>
          <div className="flex items-center space-x-1">
            <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
              <Command className="w-3 h-3 inline mr-1" />
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Status Indicators */}
        <div className="hidden lg:flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Current Time */}
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {currentTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Search Button (Mobile) */}
          <button
            onClick={openCommandPalette}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>

          {/* Activity Monitor */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggleButton />

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* User Profile */}
          <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
              Security Analyst
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
