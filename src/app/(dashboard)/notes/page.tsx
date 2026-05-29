'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Note } from '@/types'
import { Plus, Pin, PinOff, Trash2, BookOpen, BookHeart, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function NotesPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState<'all' | 'note' | 'diary'>('all')
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'note' as 'note' | 'diary', tags: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('notes').select('*').eq('user_id', user.id)
        .order('is_pinned', { ascending: false }).order('updated_at', { ascending: false })
      setNotes(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const filtered = notes.filter(n => {
    if (activeType !== 'all' && n.type !== activeType) return false
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const saveNote = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    if (selectedNote && !creating) {
      const { data } = await supabase.from('notes').update({
        title: form.title, content: form.content || null, type: form.type, tags,
      }).eq('id', selectedNote.id).select().single()
      if (data) {
        setNotes(prev => prev.map(n => n.id === selectedNote.id ? data : n))
        setSelectedNote(data)
        toast.success('Сохранено')
      }
    } else {
      const { data } = await supabase.from('notes').insert({
        user_id: user.id, title: form.title, content: form.content || null, type: form.type, tags,
      }).select().single()
      if (data) {
        setNotes(prev => [data, ...prev])
        setSelectedNote(data)
        setCreating(false)
        toast.success('Заметка создана!')
      }
    }
    setSaving(false)
  }

  const togglePin = async (note: Note) => {
    const { data } = await supabase.from('notes').update({ is_pinned: !note.is_pinned }).eq('id', note.id).select().single()
    if (data) setNotes(prev => prev.map(n => n.id === note.id ? data : n).sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)))
  }

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
    if (selectedNote?.id === id) setSelectedNote(null)
    toast.success('Удалено')
  }

  const openNote = (note: Note) => {
    setCreating(false)
    setSelectedNote(note)
    setForm({ title: note.title, content: note.content || '', type: note.type, tags: note.tags?.join(', ') || '' })
  }

  const startCreate = (type: 'note' | 'diary' = 'note') => {
    setCreating(true)
    setSelectedNote(null)
    const today = format(new Date(), 'd MMMM yyyy', { locale: ru })
    setForm({ title: type === 'diary' ? today : '', content: '', type, tags: '' })
  }

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Заметки и дневник"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => startCreate('diary')}>
              <BookHeart size={16} /> Запись
            </Button>
            <Button size="sm" onClick={() => startCreate('note')}>
              <Plus size={16} /> Заметка
            </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-72 md:border-r border-b md:border-b-0 border-gray-100 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-950 md:max-h-[calc(100vh-56px)] max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-gray-800">
            {[
              { key: 'all', label: 'Все' },
              { key: 'note', label: 'Заметки' },
              { key: 'diary', label: 'Дневник' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setActiveType(t.key as typeof activeType)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeType === t.key
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto py-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Загрузка...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Нет заметок</div>
            ) : (
              filtered.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note)}
                  className={`w-full text-left px-3 py-2.5 mx-1 rounded-xl transition-all group ${
                    selectedNote?.id === note.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {note.type === 'diary' ? '📖' : '📝'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {note.is_pinned && <Pin size={10} className="text-primary-500 flex-shrink-0" />}
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{note.title}</p>
                      </div>
                      {note.content && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{note.content.slice(0, 60)}</p>
                      )}
                      <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
                        {formatDate(note.updated_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
          {(selectedNote || creating) ? (
            <div className="flex-1 flex flex-col">
              {/* Editor toolbar */}
              <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setForm(p => ({ ...p, type: p.type === 'note' ? 'diary' : 'note' }))}
                    className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    {form.type === 'diary' ? <BookHeart size={14} /> : <BookOpen size={14} />}
                    {form.type === 'diary' ? 'Дневник' : 'Заметка'}
                  </button>
                </div>
                <div className="flex gap-2">
                  {selectedNote && !creating && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => togglePin(selectedNote)}>
                        {selectedNote.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteNote(selectedNote.id)} className="text-red-400">
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                  <Button size="sm" loading={saving} onClick={saveNote}>Сохранить</Button>
                </div>
              </div>

              {/* Title */}
              <div className="px-8 pt-8 pb-2">
                <input
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Заголовок..."
                  className="w-full text-2xl font-bold bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div className="px-8 pb-3">
                <input
                  value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  placeholder="Теги (через запятую)..."
                  className="text-xs bg-transparent text-gray-400 placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none"
                />
              </div>

              {/* Content */}
              <div className="px-8 pb-8 flex-1">
                <textarea
                  value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Начните писать..."
                  className="w-full h-full min-h-[400px] bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-700 focus:outline-none text-sm leading-relaxed resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-5xl mb-4">📝</p>
                <p className="text-gray-500 font-medium">Выберите заметку или создайте новую</p>
                <div className="flex gap-3 mt-4 justify-center">
                  <Button variant="outline" onClick={() => startCreate('note')}><BookOpen size={16} /> Заметка</Button>
                  <Button onClick={() => startCreate('diary')}><BookHeart size={16} /> Запись в дневник</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
