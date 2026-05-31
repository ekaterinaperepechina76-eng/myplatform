'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, CheckSquare, Target, Calendar,
  Heart, BookOpen, PenLine, Star, ChevronDown, ChevronRight,
  LogOut, Zap, X
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { getInitials } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  children?: NavItem[]
  badge?: string
}

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Дашборд', icon: <LayoutDashboard size={18} /> },
  {
    href: '/flueng', label: 'FLUENG', icon: <Briefcase size={18} />, badge: 'Бизнес',
    children: [
      { href: '/flueng/knowledge', label: 'База знаний', icon: <BookOpen size={16} /> },
      { href: '/flueng/finances', label: 'Финансы', icon: <Zap size={16} /> },
      { href: '/flueng/crm', label: 'CRM', icon: <Star size={16} /> },
      { href: '/flueng/goals', label: 'Цели', icon: <Target size={16} /> },
      { href: '/flueng/tasks', label: 'Задачи', icon: <CheckSquare size={16} /> },
    ],
  },
  {
    href: '/sokl', label: 'SOKL', icon: <Briefcase size={18} />, badge: 'Бизнес',
    children: [
      { href: '/sokl/knowledge', label: 'База знаний', icon: <BookOpen size={16} /> },
      { href: '/sokl/finances', label: 'Финансы', icon: <Zap size={16} /> },
      { href: '/sokl/crm', label: 'CRM', icon: <Star size={16} /> },
      { href: '/sokl/goals', label: 'Цели', icon: <Target size={16} /> },
      { href: '/sokl/tasks', label: 'Задачи', icon: <CheckSquare size={16} /> },
    ],
  },
  { href: '/habits', label: 'Привычки', icon: <Heart size={18} /> },
  { href: '/goals', label: 'Цели', icon: <Target size={18} /> },
  { href: '/calendar', label: 'Календарь', icon: <Calendar size={18} /> },
  { href: '/wishlist', label: 'Вишлист', icon: <Star size={18} /> },
  { href: '/blog', label: 'Блог', icon: <PenLine size={18} /> },
  { href: '/notes', label: 'Заметки', icon: <BookOpen size={18} /> },
]

function NavItemComponent({ item, depth = 0, onNavigate }: { item: NavItem; depth?: number; onNavigate: () => void }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(
    item.children?.some(child => pathname.startsWith(child.href)) ||
    pathname.startsWith(item.href + '/')
  )
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
            isActive
              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
          )}
        >
          <span className={cn('flex-shrink-0', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300')}>
            {item.icon}
          </span>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="text-[10px] bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-md font-medium">
              {item.badge}
            </span>
          )}
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="mt-1 ml-3 pl-3 border-l border-gray-100 dark:border-gray-800 space-y-0.5">
            {item.children.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      prefetch={true}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
        pathname === item.href || pathname.startsWith(item.href + '/')
          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100',
        depth > 0 && 'py-2'
      )}
    >
      <span className={cn(
        'flex-shrink-0',
        pathname === item.href || pathname.startsWith(item.href + '/')
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
      )}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const { isOpen, close } = useSidebar()

  // Close sidebar on route change (mobile)
  const pathname = usePathname()
  useEffect(() => { close() }, [pathname])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-50 w-64 flex-shrink-0 bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out',
        'lg:static lg:translate-x-0 lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100">MyPlatform</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Личное пространство</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={close}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => (
            <NavItemComponent key={item.href} item={item} onNavigate={close} />
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {profile?.full_name ? getInitials(profile.full_name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {profile?.full_name || 'Пользователь'}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{profile?.role || 'owner'}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Выйти"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop spacer — keeps layout when sidebar is static */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}
