import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function Progress({ value, max = 100, className, color, size = 'md', showLabel }: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn(
        'flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden',
        { 'h-1.5': size === 'sm', 'h-2': size === 'md', 'h-3': size === 'lg' }
      )}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            backgroundColor: color || undefined,
          }}
          {...(!color && { className: 'h-full rounded-full bg-primary-500 transition-all duration-500' })}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-10 text-right">
          {percentage}%
        </span>
      )}
    </div>
  )
}
