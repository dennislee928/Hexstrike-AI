'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface Tool {
  id: string
  name: string
  description: string
  status: 'available' | 'unavailable' | 'installed'
  category: string
  href?: string
}

interface VirtualizedToolListProps {
  tools: Tool[]
  onToolClick?: (tool: Tool) => void
  searchQuery?: string
  className?: string
  itemHeight?: number
  maxHeight?: number
}

interface ToolItemProps {
  tool: Tool
  onToolClick?: (tool: Tool) => void
}

const ToolItem = memo(({ tool, onToolClick }: ToolItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400 border-green-500'
      case 'installed': return 'text-blue-400 border-blue-500'
      case 'unavailable': return 'text-red-400 border-red-500'
      default: return 'text-gray-400 border-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '●'
      case 'installed': return '✓'
      case 'unavailable': return '✗'
      default: return '○'
    }
  }

  return (
    <div className="px-2 mb-4">
      <div
        onClick={() => onToolClick?.(tool)}
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700',
          'cursor-pointer group transition-all duration-200',
          'hover:scale-[1.02] hover:shadow-lg hover:border-green-500 dark:hover:border-green-400',
          getStatusColor(tool.status)
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToolClick?.(tool)
          }
        }}
        aria-label={`${tool.name} - ${tool.description}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400">
              {tool.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {getStatusIcon(tool.status)} {tool.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {tool.description}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            Category: {tool.category}
          </span>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400">
            Click to configure →
          </span>
        </div>
      </div>
    </div>
  )
})

ToolItem.displayName = 'ToolItem'

export const VirtualizedToolList = memo(({
  tools,
  onToolClick,
  searchQuery = '',
  className,
  itemHeight = 180,
  maxHeight = 600
}: VirtualizedToolListProps) => {
  const filteredTools = useMemo(() => {
    if (!searchQuery) return tools
    
    const query = searchQuery.toLowerCase()
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    )
  }, [tools, searchQuery])

  if (filteredTools.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <div className="text-lg mb-2">No tools found</div>
            {searchQuery && (
              <div className="text-sm">
                No tools match "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
        Showing {filteredTools.length} of {tools.length} tools
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredTools.map((tool) => (
          <ToolItem
            key={tool.id}
            tool={tool}
            onToolClick={onToolClick}
          />
        ))}
      </div>
    </div>
  )
})

VirtualizedToolList.displayName = 'VirtualizedToolList'