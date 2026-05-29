import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      {
        'px-2 py-0.5 text-xs': size === 'sm',
        'px-3 py-1 text-sm': size === 'md',
        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400': variant === 'default',
        'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': variant === 'success',
        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400': variant === 'warning',
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': variant === 'danger',
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': variant === 'info',
        'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400': variant === 'purple',
      },
      className
    )}>
      {children}
    </span>
  )
}
