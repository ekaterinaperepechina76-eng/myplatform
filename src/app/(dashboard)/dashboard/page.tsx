'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Task, Habit, Goal, CalendarEvent } from '@/types'
import { formatDate, formatShortDate } from '@/lib/utils'
import { todayMoscow, nowMoscow, formatShortDateMoscow, formatTimeMoscow } from '@/lib/tz'
import {
  CheckSquare, Target, Heart, Calendar, TrendingUp,
  Clock, Star, ArrowRight
} from 'lucide-react'
import Link from 'next/link'

interface Stats {
  tasks: { total: number; done: number }
  habits: { total: number; completedToday: number }
  goals: { total: number; avgProgress: number }
  events: CalendarEvent[]
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    tasks: { total: 0, done: 0 },
    habits: { total: 0, completedToday: 0 },
    goals: { total: 0, avgProgress: 0 },
    events: [],
  })
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const today = todayMoscow()
  const greetingHour = nowMoscow().getHours()
  const greeting = greetingHour < 12 ? 'Доброе утро' : greetingHour < 18 ? 'Добрый день' : 'Добрый вечер'

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [tasksRes, habitsRes, habitsLogRes, goalsRes, eventsRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
        supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').limit(4),
        supabase.from('events').select('*').eq('user_id', user.id).gte('start_time', today).order('start_time').limit(5),
      ])

      const tasks = tasksRes.data || []
      const habits = habitsRes.data || []
      const habitLogs = habitsLogRes.data || []
      const goalData = goalsRes.data || []
      const eventData = eventsRes.data || []

      const avgProgress = goalData.length
        ? Math.round(goalData.reduce((s, g) => s + g.progress, 0) / goalData.length)
        : 0

      setStats({
        tasks: { total: tasks.length, done: tasks.filter(t => t.status === 'done').length },
        habits: { total: habits.length, completedToday: habitLogs.length },
        goals: { total: goalData.length, avgProgress },
        events: eventData,
      })
      setRecentTasks(tasks.filter(t => t.status !== 'done').slice(0, 5))
      setGoals(goalData)
      setLoading(false)
    }
    load()
  }, [user])

  const statCards = [
    {
      label: 'Задачи',
      value: `${stats.tasks.done}/${stats.tasks.total}`,
      sub: 'выполнено',
      icon: <CheckSquare size={20} />,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      href: '/flueng/tasks',
    },
    {
      label: 'Привычки сегодня',
      value: `${stats.habits.completedToday}/${stats.habits.total}`,
      sub: 'отмечено',
      icon: <Heart size={20} />,
      color: 'text-pink-500',
      bg: 'bg-pink-50 dark:bg-pink-900/20',
      href: '/habits',
    },
    {
      label: 'Цели',
      value: `${stats.goals.avgProgress}%`,
      sub: 'средний прогресс',
      icon: <Target size={20} />,
      color: 'text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      href: '/goals',
    },
    {
      label: 'Событий',
      value: stats.events.length.toString(),
      sub: 'предстоит',
      icon: <Calendar size={20} />,
      color: 'text-green-500',
      bg: 'bg-green-50 dark:bg-green-900/20',
      href: '/calendar',
    },
  ]

  return (
    <div className="flex flex-col flex-1">
      <Header title="Дашборд" subtitle={formatDate(new Date())} />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 flex-1">
        {/* Greeting */}
        <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-2xl p-4 md:p-6 text-white">
          <p className="text-primary-200 text-sm font-medium">{greeting},</p>
          <h2 className="text-xl md:text-2xl font-bold mt-0.5">
            {profile?.full_name?.split(' ')[0] || 'Пользователь'} 👋
          </h2>
          <p className="text-primary-200 text-sm mt-2">
            Сегодня {formatDate(new Date())} — продуктивного дня!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card hover className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{s.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${s.bg}`}>
                    <span className={s.color}>{s.icon}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Active Goals */}
          <Card>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Активные цели</CardTitle>
              <Link href="/goals" className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
                Все <ArrowRight size={12} />
              </Link>
            </div>
            <CardContent className="space-y-4">
              {goals.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Целей нет. Добавьте первую!</p>
              ) : (
                goals.map((goal) => (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{goal.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={goal.period === 'yearly' ? 'purple' : goal.period === 'quarterly' ? 'info' : 'success'}>
                          {goal.period === 'monthly' ? 'Месяц' : goal.period === 'quarterly' ? 'Квартал' : 'Год'}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{goal.progress}%</span>
                      </div>
                    </div>
                    <Progress value={goal.progress} size="sm" />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Актуальные задачи</CardTitle>
              <Link href="/flueng/tasks" className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
                Все <ArrowRight size={12} />
              </Link>
            </div>
            <CardContent className="space-y-3">
              {recentTasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Активных задач нет</p>
              ) : (
                recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{task.title}</span>
                    <Badge variant={task.status === 'in_progress' ? 'info' : 'default'}>
                      {task.status === 'todo' ? 'В очереди' : 'В работе'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Предстоящие события</CardTitle>
              <Link href="/calendar" className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-1">
                Все <ArrowRight size={12} />
              </Link>
            </div>
            <CardContent className="space-y-3">
              {stats.events.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Событий нет</p>
              ) : (
                stats.events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3">
                    <div
                      className="w-1 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {formatShortDateMoscow(event.start_time)}, {formatTimeMoscow(event.start_time)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <CardTitle>Быстрый переход</CardTitle>
            </div>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { href: '/habits', label: 'Привычки', emoji: '❤️', color: 'bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30' },
                { href: '/blog', label: 'Блог', emoji: '✍️', color: 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' },
                { href: '/notes', label: 'Заметки', emoji: '📝', color: 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' },
                { href: '/wishlist', label: 'Вишлист', emoji: '⭐', color: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.color}`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
