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
import { Plus, Edit2, Trash2, Instagram, Calendar, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, BLOG_PLATFORMS } from '@/lib/utils'
import { formatDateTimeMoscow, localInputToUtc, utcToLocalInput } from '@/lib/tz'

const typeOptions = [
  { value: 'post', label: '📸 Пост' },
  { value: 'reel', label: '🎬 Рилс' },
  { value: 'story', label: '⚡ Сторис' },
  { value: 'idea', label: '💡 Идея' },
]
const statusOptions = [
  { value: 'draft', label: '📝 Черновик' },
  { value: 'scheduled', label: '📅 Запланировано' },
  { value: 'published', label: '✅ Опубликовано' },
]
const platformOptions = BLOG_PLATFORMS.map(p => ({ value: p, label: p }))

const TYPE_COLORS: Record<string, string> = {
  post: 'info', reel: 'danger', story: 'warning', idea: 'purple',
}
const STATUS_COLORS: Record<string, string> = {
  draft: 'default', scheduled: 'info', published: 'success',
}

export default function BlogPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editPost, setEditPost] = useState<BlogPost | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'post' | 'reel' | 'story' | 'idea'>('all')
  const [form, setForm] = useState({
    title: '', content: '', type: 'post', status: 'draft',
    platform: 'Instagram', scheduled_at: '', tags: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('blog_posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setPosts(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const openCreate = () => {
    setEditPost(null)
    setForm({ title: '', content: '', type: activeTab === 'all' ? 'post' : activeTab, status: 'draft', platform: 'Instagram', scheduled_at: '', tags: '' })
    setModalOpen(true)
  }

  const openEdit = (post: BlogPost) => {
    setEditPost(post)
    setForm({
      title: post.title, content: post.content || '',
      type: post.type, status: post.status,
      platform: post.platform, scheduled_at: post.scheduled_at || '',
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
      type: form.type as BlogPost['type'], status: form.status as BlogPost['status'],
      platform: form.platform,
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

  const filtered = activeTab === 'all' ? posts : posts.filter(p => p.type === activeTab)

  const counts = {
    all: posts.length,
    post: posts.filter(p => p.type === 'post').length,
    reel: posts.filter(p => p.type === 'reel').length,
    story: posts.filter(p => p.type === 'story').length,
    idea: posts.filter(p => p.type === 'idea').length,
  }

  const tabs = [
    { key: 'all', label: 'Все', emoji: '📋' },
    { key: 'post', label: 'Посты', emoji: '📸' },
    { key: 'reel', label: 'Рилсы', emoji: '🎬' },
    { key: 'story', label: 'Сторис', emoji: '⚡' },
    { key: 'idea', label: 'Идеи', emoji: '💡' },
  ] as const

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Блог & Контент"
        subtitle="Стратегия, планирование, контент"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Создать
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {tabs.slice(1).map(tab => (
            <Card key={tab.key} hover onClick={() => setActiveTab(tab.key)} className={activeTab === tab.key ? 'ring-2 ring-primary-400' : ''}>
              <CardContent className="p-3 text-center">
                <p className="text-xl mb-1">{tab.emoji}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{counts[tab.key]}</p>
                <p className="text-xs text-gray-400">{tab.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto scrollbar-thin w-full md:w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              <span className="text-xs opacity-60">({counts[tab.key]})</span>
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✍️</p>
            <p className="text-gray-500 font-medium">Нет контента</p>
            <Button className="mt-4" onClick={openCreate}><Plus size={16} /> Создать первый</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((post) => (
              <Card key={post.id} hover onClick={() => openEdit(post)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant={TYPE_COLORS[post.type] as any}>
                        {typeOptions.find(t => t.value === post.type)?.label}
                      </Badge>
                      <Badge variant={STATUS_COLORS[post.status] as any}>
                        {statusOptions.find(s => s.value === post.status)?.label?.split(' ')[1]}
                      </Badge>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePost(post.id) }}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{post.title}</h3>
                  {post.content && (
                    <p className="text-sm text-gray-400 line-clamp-3">{post.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <span className="text-xs text-gray-400">{post.platform}</span>
                    {post.scheduled_at && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {formatDateTimeMoscow(post.scheduled_at)}
                      </span>
                    )}
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1 ml-auto">
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] text-primary-500">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPost ? 'Редактировать' : 'Новый контент'} size="lg">
        <div className="space-y-4">
          <Input label="Заголовок" placeholder="Тема поста..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Текст / описание" placeholder="Напишите текст..." value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Тип" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} options={typeOptions} />
            <Select label="Статус" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} options={statusOptions} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Платформа" value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} options={platformOptions} />
            <Input label="Дата публикации" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} />
          </div>
          <Input label="Теги (через запятую)" placeholder="#бизнес, #мотивация..." value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={savePost}>{editPost ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
