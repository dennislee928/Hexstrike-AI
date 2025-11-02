import { Dashboard } from '@/components/Dashboard'
import { Suspense } from 'react'
import { 
  Zap, 
  Shield, 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Welcome Banner */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Welcome to{' '}
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  HexStrike AI
                </span>
              </h1>
              
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Advanced AI-powered cybersecurity automation platform with 150+ security tools, 
                12+ autonomous AI agents, and seamless MCP integration for penetration testing, 
                bug bounty hunting, and CTF competitions.
              </p>

              {/* Quick Stats */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">150+</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Security Tools</p>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">12+</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">AI Agents</p>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">24/7</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monitoring</p>
                </div>
                
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uptime</p>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Comprehensive Arsenal
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Access 150+ professional security tools across network, web, binary, cloud, and forensics domains.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI-Powered Automation
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  12+ specialized AI agents for bug bounty hunting, CTF competitions, and vulnerability intelligence.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Real-time Monitoring
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Live process monitoring, system metrics, and intelligent caching with beautiful visualizations.
                </p>
              </div>
            </div>

            {/* System Status Overview */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Status
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    All Systems Operational
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">API Server</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Online</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">AI Agents</p>
                    <p className="text-xs text-green-600 dark:text-green-400">12 Active</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Response Time</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">< 100ms</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Uptime</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">99.9%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="bg-gray-50 dark:bg-gray-900">
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        }>
          <Dashboard />
        </Suspense>
      </div>
    </div>
  )
}
