'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { BlogPost } from '@/types'
import { Plus, Trash2, Edit2, Calendar, CheckSquare, Square, Check, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTimeMoscow, localInputToUtc, todayMoscow } from '@/lib/tz'
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'

// ─── Конфиг платформ ─────────────────────────────────────────────────────────

type PlatformId = 'instagram' | 'tiktok' | 'youtube' | 'telegram'

interface PlatformConfig {
  id: PlatformId
  name: string
  emoji: string
  types: string[]
  gradient: string          // для хедера карточки
  activeBg: string          // активная вкладка
  activeText: string
  badge: string             // цвет бейджа
  tabBorder: string         // нижний бордер активной вкладки
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    emoji: '📸',
    types: ['post', 'reel', 'story', 'idea', 'funnel'],
    gradient: 'from-pink-500 via-rose-500 to-purple-600',
    activeBg: 'bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20',
    activeText: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    tabBorder: 'border-b-2 border-pink-500',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    emoji: '🎵',
    types: ['reel', 'idea', 'funnel'],
    gradient: 'from-gray-900 to-gray-800',
    activeBg: 'bg-gray-900/5 dark:bg-gray-700/30',
    activeText: 'text-gray-900 dark:text-gray-100',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    tabBorder: 'border-b-2 border-gray-900 dark:border-gray-400',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    emoji: '▶️',
    types: ['video', 'idea', 'funnel'],
    gradient: 'from-red-600 to-red-500',
    activeBg: 'bg-red-50 dark:bg-red-900/20',
    activeText: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    tabBorder: 'border-b-2 border-red-600',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    emoji: '✈️',
    types: ['post', 'funnel', 'podcast', 'idea'],
    gradient: 'from-blue-500 to-sky-400',
    activeBg: 'bg-blue-50 dark:bg-blue-900/20',
    activeText: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    tabBorder: 'border-b-2 border-blue-500',
  },
]

const TYPE_LABELS: Record<string, string> = {
  post: 'Пост', reel: 'Рилс', story: 'Сторис',
  idea: 'Идея', funnel: 'Воронка', video: 'Видео', podcast: 'Подкаст',
}

const TYPE_ICONS: Record<string, string> = {
  post: '📝', reel: '🎬', story: '⚡',
  idea: '💡', funnel: '🔺', video: '🎥', podcast: '🎙️',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' }> = {
  draft:     { label: 'Черновик',      variant: 'default' },
  scheduled: { label: 'Запланировано', variant: 'info' },
  published: { label: 'Опубликовано',  variant: 'success' },
}

const TZ = 'Europe/Moscow'

// ─── Хелперы ─────────────────────────────────────────────────────────────────

function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

// ─── Компонент ────────────────────────────────────────────────────────────────

interface BlogTask {
  id: string
  title: string
  done: boolean
  week_start: string
}

type MainTab = 'content' | 'plan' | 'tasks'

export default function BlogPage() {
  const { user } = useAuth()
  const supabase = createClient()

  // State
  const [mainTab, setMainTab] = useState<MainTab>('content')
  const [activePlatform, setActivePlatform] = useState<PlatformId>('instagram')
  const [activeType, setActiveType] = useState('all')
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [blogTasks, setBlogTasks] = useState<BlogTask[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(() => getWeekStart())

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', content: '', type: 'post',
    status: 'draft', scheduled_at: '', tags: '',
  })

  // Task input
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const platform = PLATFORMS.find(p => p.id === activePlatform)!
  const weekDays = getWeekDays(weekStart)
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')

  // ─── Load data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [postsRes, tasksRes] = await Promise.all([
        supabase.from('blog_posts').select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('blog_tasks').select('*').eq('user_id', user.id)
          .eq('week_start', weekStartStr),
      ])
      setPosts(postsRes.data || [])
      setBlogTasks(tasksRes.data || [])
      setLoading(false)
    }
    load()
  }, [user, weekStartStr])

  // ─── Posts CRUD ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditPost(null)
    setForm({
      title: '', content: '', type: platform.types[0],
      status: 'draft', scheduled_at: '', tags: '',
    })
    setModalOpen(true)
  }

  const openEdit = (post: BlogPost) => {
    setEditPost(post)
    setForm({
      title: post.title, content: post.content || '',
      type: post.type, status: post.status,
      scheduled_at: post.scheduled_at
        ? formatInTimeZone(parseISO(post.scheduled_at), TZ, "yyyy-MM-dd'T'HH:mm")
        : '',
      tags: post.tags?.join(', ') || '',
    })
    setModalOpen(true)
  }

  const savePost = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const payload = {
      title: form.title, content: form.content || null,
      type: form.type as BlogPost['type'],
      status: form.status as BlogPost['status'],
      platform: activePlatform,
      scheduled_at: form.scheduled_at ? localInputToUtc(form.scheduled_at) : null,
      tags, user_id: user.id,
    }
    if (editPost) {
      const { data } = await supabase.from('blog_posts').update(payload).eq('id', editPost.id).select().single()
      if (data) { setPosts(prev => prev.map(p => p.id === editPost.id ? data : p)); toast.success('Обновлено') }
    } else {
      const { data } = await supabase.from('blog_posts').insert(payload).select().single()
      if (data) { setPosts(prev => [data, ...prev]); toast.success('Создано!') }
    }
    setSaving(false)
    setModalOpen(false)
  }

  const deletePost = async (id: string) => {
    await supabase.from('blog_posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    toast.success('Удалено')
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = async () => {
    if (!user || !newTaskTitle.trim()) return
    const { data } = await supabase.from('blog_tasks').insert({
      user_id: user.id, title: newTaskTitle.trim(),
      done: false, week_start: weekStartStr,
    }).select().single()
    if (data) { setBlogTasks(prev => [...prev, data]); setNewTaskTitle('') }
  }

  const toggleTask = async (task: BlogTask) => {
    const { data } = await supabase.from('blog_tasks').update({ done: !task.done }).eq('id', task.id).select().single()
    if (data) setBlogTasks(prev => prev.map(t => t.id === task.id ? data : t))
  }

  const deleteTask = async (id: string) => {
    await supabase.from('blog_tasks').delete().eq('id', id)
    setBlogTasks(prev => prev.filter(t => t.id !== id))
  }

  // ─── Фильтрация ────────────────────────────────────────────────────────────

  const platformPosts = posts.filter(p => p.platform === activePlatform)
  const filteredPosts = activeType === 'all'
    ? platformPosts
    : platformPosts.filter(p => p.type === activeType)

  const stats = PLATFORMS.reduce((acc, pl) => {
    acc[pl.id] = posts.filter(p => p.platform === pl.id).length
    return acc
  }, {} as Record<string, number>)

  // Посты для контент-плана (запланированные на текущую неделю)
  const weekPosts = posts.filter(p => {
    if (!p.scheduled_at) return false
    const d = parseISO(p.scheduled_at)
    return d >= weekStart && d <= addDays(weekStart, 6)
  })

  const getPostsForDayAndPlatform = (day: Date, pid: PlatformId) =>
    weekPosts.filter(p => {
      if (p.platform !== pid || !p.scheduled_at) return false
      const d = parseISO(p.scheduled_at)
      return isSameDay(d, day)
    })

  const mainTabs = [
    { id: 'content' as MainTab, label: 'Контент', icon: <LayoutGrid size={15} /> },
    { id: 'plan' as MainTab, label: 'Контент-план', icon: <Calendar size={15} /> },
    { id: 'tasks' as MainTab, label: 'Задачи', icon: <CheckSquare size={15} /> },
  ]

  const doneCount = blogTasks.filter(t => t.done).length

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Блог"
        subtitle="Контент-стратегия и планирование"
        actions={
          mainTab === 'content' ? (
            <Button size="sm" onClick={openCreate}>
              <Plus size={16} /> Создать
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 flex flex-col">
        {/* ── Главные вкладки ─────────────────────────────────────────── */}
        <div className="px-4 md:px-6 pt-4 flex gap-1 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
          {mainTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all border-b-2 -mb-px ${
                mainTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* КОНТЕНТ                                                        */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {mainTab === 'content' && (
          <div className="p-4 md:p-6 space-y-5 flex-1">

            {/* Platform cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PLATFORMS.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => { setActivePlatform(pl.id); setActiveType('all') }}
                  className={`rounded-2xl overflow-hidden transition-all duration-200 text-left ${
                    activePlatform === pl.id
                      ? 'ring-2 ring-offset-2 ring-primary-400 shadow-md scale-[1.02]'
                      : 'hover:shadow-sm hover:scale-[1.01] opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${pl.gradient} p-4 flex items-center gap-2`}>
                    <span className="text-2xl">{pl.emoji}</span>
                    <span className="text-white font-bold text-sm">{pl.name}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-900 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">{stats[pl.id] || 0} постов</span>
                    {activePlatform === pl.id && (
                      <span className="w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Platform header */}
            <div className={`rounded-2xl p-4 flex items-center justify-between ${platform.activeBg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${platform.gradient} flex items-center justify-center text-xl`}>
                  {platform.emoji}
                </div>
                <div>
                  <h2 className={`font-bold ${platform.activeText}`}>{platform.name}</h2>
                  <p className="text-xs text-gray-400">{platformPosts.length} материалов</p>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {platform.types.map(t => (
                  <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${platform.badge}`}>
                    {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                  </span>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setActiveType('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  activeType === 'all'
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Все ({platformPosts.length})
              </button>
              {platform.types.map(t => {
                const count = platformPosts.filter(p => p.type === t).length
                return (
                  <button
                    key={t}
                    onClick={() => setActiveType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1 ${
                      activeType === t
                        ? `${platform.badge} ring-1 ring-current`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                    <span className="opacity-60">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Posts grid */}
            {loading ? (
              <div className="text-center py-12 text-gray-400">Загрузка...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                <p className="text-3xl mb-2">{platform.emoji}</p>
                <p className="text-gray-500 font-medium">Нет контента для {platform.name}</p>
                <Button className="mt-4" onClick={openCreate}>
                  <Plus size={16} /> Создать первый
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map(post => (
                  <Card key={post.id} hover onClick={() => openEdit(post)}>
                    {/* Цветная полоска сверху */}
                    <div className={`h-1 bg-gradient-to-r ${platform.gradient} rounded-t-2xl`} />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${platform.badge}`}>
                            {TYPE_ICONS[post.type]} {TYPE_LABELS[post.type]}
                          </span>
                          <Badge variant={STATUS_CONFIG[post.status]?.variant ?? 'default'}>
                            {STATUS_CONFIG[post.status]?.label}
                          </Badge>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deletePost(post.id) }}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-2">
                        {post.title}
                      </h3>
                      {post.content && (
                        <p className="text-xs text-gray-400 line-clamp-2">{post.content}</p>
                      )}
                      {post.scheduled_at && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDateTimeMoscow(post.scheduled_at)}
                        </p>
                      )}
                      {post.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {post.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] text-primary-500">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* КОНТЕНТ-ПЛАН                                                   */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {mainTab === 'plan' && (
          <div className="p-4 md:p-6 space-y-4 flex-1">
            {/* Навигация по неделям */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeekStart(d => addDays(d, -7))}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                ← Предыдущая
              </button>
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {format(weekStart, 'd MMM', { locale: ru })} — {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ru })}
                </p>
              </div>
              <button
                onClick={() => setWeekStart(d => addDays(d, 7))}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Следующая →
              </button>
            </div>

            {/* Таблица контент-плана */}
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">
                      Платформа
                    </th>
                    {weekDays.map(day => {
                      const isToday = isSameDay(day, new Date())
                      return (
                        <th
                          key={day.toISOString()}
                          className={`px-2 py-3 text-center text-xs font-semibold ${
                            isToday
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-gray-500'
                          }`}
                        >
                          <div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center mb-0.5 ${
                            isToday ? 'bg-primary-600 text-white' : ''
                          }`}>
                            {format(day, 'd')}
                          </div>
                          <div className="uppercase text-[10px] tracking-wide">
                            {format(day, 'EEE', { locale: ru })}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {PLATFORMS.map(pl => (
                    <tr key={pl.id} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${pl.gradient} flex items-center justify-center text-sm`}>
                            {pl.emoji}
                          </div>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {pl.name}
                          </span>
                        </div>
                      </td>
                      {weekDays.map(day => {
                        const dayPosts = getPostsForDayAndPlatform(day, pl.id)
                        return (
                          <td key={day.toISOString()} className="px-1 py-2 align-top">
                            <div className="space-y-1 min-h-[40px]">
                              {dayPosts.map(post => (
                                <button
                                  key={post.id}
                                  onClick={() => { setActivePlatform(pl.id); openEdit(post) }}
                                  title={post.title}
                                  className={`w-full text-left text-[10px] px-1.5 py-1 rounded-lg font-medium leading-tight ${pl.badge} hover:opacity-80 transition-opacity`}
                                >
                                  {TYPE_ICONS[post.type]} {post.title.slice(0, 20)}{post.title.length > 20 ? '…' : ''}
                                </button>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Легенда */}
            <div className="flex gap-4 flex-wrap text-xs text-gray-400">
              <span>💡 Кликни на пост — откроется редактор</span>
              <span>📅 Посты с датой публикации попадают в таблицу</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ЗАДАЧИ                                                         */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {mainTab === 'tasks' && (
          <div className="p-4 md:p-6 space-y-4 flex-1">
            {/* Навигация по неделям */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWeekStart(d => addDays(d, -7))}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                ← Предыдущая
              </button>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {format(weekStart, 'd MMM', { locale: ru })} — {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ru })}
              </p>
              <button
                onClick={() => setWeekStart(d => addDays(d, 7))}
                className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Следующая →
              </button>
            </div>

            {/* Прогресс */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Задачи на неделю
                </h3>
                <span className="text-sm text-gray-500">
                  {doneCount} / {blogTasks.length} выполнено
                </span>
              </div>
              {blogTasks.length > 0 && (
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-1">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${blogTasks.length ? (doneCount / blogTasks.length) * 100 : 0}%` }}
                  />
                </div>
              )}
            </Card>

            {/* Добавить задачу */}
            <div className="flex gap-2">
              <input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Новая задача... (Enter для добавления)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
              />
              <Button size="sm" onClick={addTask}>
                <Plus size={16} />
              </Button>
            </div>

            {/* Список задач */}
            <div className="space-y-2">
              {blogTasks.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <p className="text-3xl mb-2">✅</p>
                  <p className="text-gray-500 text-sm">Нет задач на эту неделю</p>
                </div>
              ) : (
                blogTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                      task.done
                        ? 'border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10'
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        task.done
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                      }`}
                    >
                      {task.done && <Check size={12} />}
                    </button>
                    <span className={`flex-1 text-sm ${
                      task.done
                        ? 'line-through text-gray-400 dark:text-gray-500'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── Модалка создания/редактирования ─────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editPost ? 'Редактировать' : `Новый контент — ${platform.name}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Platform indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${platform.activeBg}`}>
            <span className="text-lg">{platform.emoji}</span>
            <span className={`text-sm font-medium ${platform.activeText}`}>{platform.name}</span>
          </div>

          <Input
            label="Заголовок / тема"
            placeholder="О чём контент?"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          />
          <Textarea
            label="Текст / описание"
            placeholder="Набросок, идея, сценарий..."
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            rows={5}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Тип"
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              options={platform.types.map(t => ({ value: t, label: `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}` }))}
            />
            <Select
              label="Статус"
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              options={[
                { value: 'draft', label: '📝 Черновик' },
                { value: 'scheduled', label: '📅 Запланировано' },
                { value: 'published', label: '✅ Опубликовано' },
              ]}
            />
          </div>
          <Input
            label="Дата публикации (МСК)"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))}
          />
          <Input
            label="Теги (через запятую)"
            placeholder="#контент, #лайфстайл..."
            value={form.tags}
            onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button className="flex-1" loading={saving} onClick={savePost}>
              {editPost ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
