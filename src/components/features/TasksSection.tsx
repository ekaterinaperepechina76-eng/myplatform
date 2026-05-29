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
import { Task } from '@/types'
import { Plus, CheckCircle2, Circle, Clock, Trash2, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import { formatDateMoscow } from '@/lib/tz'

interface TasksSectionProps {
  businessId: string
  title: string
}

const statusConfig = {
  todo: { label: 'Очередь', color: 'default', icon: <Circle size={14} /> },
  in_progress: { label: 'В работе', color: 'info', icon: <Clock size={14} /> },
  done: { label: 'Готово', color: 'success', icon: <CheckCircle2 size={14} /> },
}
const priorityConfig = {
  high: { label: 'Высокий', color: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
  medium: { label: 'Средний', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' },
  low: { label: 'Низкий', color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
}

export function TasksSection({ businessId, title }: TasksSectionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('tasks').select('*')
        .eq('user_id', user.id).eq('business_id', businessId)
        .order('created_at', { ascending: false })
      setTasks(data || [])
      setLoading(false)
    }
    load()
  }, [user, businessId])

  const saveTask = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title, description: form.description || null,
      priority: form.priority as Task['priority'], status: form.status as Task['status'],
      due_date: form.due_date || null, business_id: businessId, user_id: user.id,
    }
    if (editTask) {
      const { data } = await supabase.from('tasks').update(payload).eq('id', editTask.id).select().single()
      if (data) { setTasks(prev => prev.map(t => t.id === editTask.id ? data : t)); toast.success('Обновлено') }
    } else {
      const { data } = await supabase.from('tasks').insert(payload).select().single()
      if (data) { setTasks(prev => [data, ...prev]); toast.success('Задача добавлена!') }
    }
    setSaving(false)
    setModalOpen(false)
  }

  const updateStatus = async (task: Task, newStatus: Task['status']) => {
    const { data } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id).select().single()
    if (data) {
      setTasks(prev => prev.map(t => t.id === task.id ? data : t))
      if (newStatus === 'done') toast.success('Задача выполнена! ✓')
    }
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Удалено')
  }

  const openEdit = (task: Task) => {
    setEditTask(task)
    setForm({ title: task.title, description: task.description || '', priority: task.priority, status: task.status, due_date: task.due_date || '' })
    setModalOpen(true)
  }

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)
  const counts = { todo: tasks.filter(t => t.status === 'todo').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, done: tasks.filter(t => t.status === 'done').length }

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={title}
        subtitle="Управление задачами"
        actions={
          <Button size="sm" onClick={() => { setEditTask(null); setForm({ title: '', description: '', priority: 'medium', status: 'todo', due_date: '' }); setModalOpen(true) }}>
            <Plus size={16} /> Задача
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {[
            { key: 'todo', label: 'В очереди', color: 'text-gray-600' },
            { key: 'in_progress', label: 'В работе', color: 'text-blue-500' },
            { key: 'done', label: 'Готово', color: 'text-green-500' },
          ].map(s => (
            <Card key={s.key} hover onClick={() => setFilterStatus(filterStatus === s.key ? 'all' : s.key)} className={filterStatus === s.key ? 'ring-2 ring-primary-400' : ''}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {(['todo', 'in_progress', 'done'] as const).map(status => {
            const statusTasks = tasks.filter(t => t.status === status)
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={statusConfig[status].color === 'info' ? 'text-blue-500' : statusConfig[status].color === 'success' ? 'text-green-500' : 'text-gray-500'}>
                    {statusConfig[status].icon}
                  </span>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{statusConfig[status].label}</h3>
                  <Badge variant="default">{statusTasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {statusTasks.map(task => (
                    <Card key={task.id} className={`group ${task.status === 'done' ? 'opacity-60' : ''}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => updateStatus(task, task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done')}
                            className={`flex-shrink-0 mt-0.5 ${task.status === 'done' ? 'text-green-500' : task.status === 'in_progress' ? 'text-blue-500' : 'text-gray-300 hover:text-primary-500'} transition-colors`}
                          >
                            {task.status === 'done' ? <CheckCircle2 size={16} /> : task.status === 'in_progress' ? <Clock size={16} /> : <Circle size={16} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${priorityConfig[task.priority].color}`}>
                                {priorityConfig[task.priority].label}
                              </span>
                              {task.due_date && (
                                <span className="text-[10px] text-gray-400">{formatDateMoscow(task.due_date)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(task)} className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors">
                              <Edit2 size={12} />
                            </button>
                            <button onClick={() => deleteTask(task.id)} className="p-1 rounded text-gray-400 hover:text-red-400 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {statusTasks.length === 0 && (
                    <div className="border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center text-xs text-gray-300 dark:text-gray-700">
                      Нет задач
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Редактировать задачу' : 'Новая задача'}>
        <div className="space-y-4">
          <Input label="Название" placeholder="Задача..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Описание" placeholder="Подробнее..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Приоритет" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
              options={[{ value: 'high', label: 'Высокий' }, { value: 'medium', label: 'Средний' }, { value: 'low', label: 'Низкий' }]}
            />
            <Select label="Статус" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              options={[{ value: 'todo', label: 'В очереди' }, { value: 'in_progress', label: 'В работе' }, { value: 'done', label: 'Готово' }]}
            />
          </div>
          <Input label="Срок" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={saveTask}>{editTask ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
