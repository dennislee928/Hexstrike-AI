'use client'

import { memo, useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useInView } from 'react-intersection-observer'
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
  index: number
  style: React.CSSProperties
  data: {
    tools: Tool[]
    onToolClick?: (tool: Tool) => void
  }
}

const ToolItem = memo(({ index, style, data }: ToolItemProps) => {
  const { tools, onToolClick } = data
  const tool = tools[index]
  
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  })

  if (!tool) return null

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
    <div style={style} ref={ref} className="px-2">
      {inView && (
        <div
          onClick={() => onToolClick?.(tool)}
          className={cn(
            'terminal-window cursor-pointer group transition-all duration-200',
            'hover:scale-[1.02] hover:shadow-lg',
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
          <div className="terminal-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-cyber font-bold group-hover:text-current">
                  {tool.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono opacity-75">
                  {getStatusIcon(tool.status)} {tool.status}
                </span>
              </div>
            </div>
          </div>
          <div className="terminal-content">
            <p className="text-sm opacity-90 mb-3 line-clamp-2">
              {tool.description}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-current/20">
              <span className="text-xs font-mono opacity-75">
                Category: {tool.category}
              </span>
              <span className="text-xs font-mono opacity-75 group-hover:opacity-100">
                Click to configure →
              </span>
            </div>
          </div>
        </div>
      )}
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

  const itemData = useMemo(() => ({
    tools: filteredTools,
    onToolClick
  }), [filteredTools, onToolClick])

  if (filteredTools.length === 0) {
    return (
      <div className="terminal-window">
        <div className="terminal-content text-center py-12">
          <div className="text-cyber-light opacity-75 mb-4">
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

  const listHeight = Math.min(maxHeight, filteredTools.length * itemHeight)

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-4 text-sm text-cyber-light font-mono">
        Showing {filteredTools.length} of {tools.length} tools
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
      
      <List
        height={listHeight}
        itemCount={filteredTools.length}
        itemSize={itemHeight}
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-cyber-primary scrollbar-track-cyber-gray"
        overscanCount={5}
      >
        {ToolItem}
      </List>
    </div>
  )
})

VirtualizedToolList.displayName = 'VirtualizedToolList'