'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Goal } from '@/types'
import { Plus, Target, Edit2, Trash2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

const periodOptions = [
  { value: 'monthly', label: 'На месяц' },
  { value: 'quarterly', label: 'На квартал' },
  { value: 'yearly', label: 'На год' },
]
const statusOptions = [
  { value: 'active', label: 'Активна' },
  { value: 'completed', label: 'Выполнена' },
  { value: 'paused', label: 'На паузе' },
]

export default function GoalsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', period: 'monthly',
    target_date: '', progress: '0', status: 'active', category: '',
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setGoals(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const openCreate = () => {
    setEditGoal(null)
    setForm({ title: '', description: '', period: activeTab, target_date: '', progress: '0', status: 'active', category: '' })
    setModalOpen(true)
  }

  const openEdit = (goal: Goal) => {
    setEditGoal(goal)
    setForm({
      title: goal.title, description: goal.description || '',
      period: goal.period, target_date: goal.target_date || '',
      progress: goal.progress.toString(), status: goal.status, category: goal.category,
    })
    setModalOpen(true)
  }

  const saveGoal = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title, description: form.description || null,
      period: form.period as Goal['period'], target_date: form.target_date || null,
      progress: parseInt(form.progress) || 0, status: form.status as Goal['status'],
      category: form.category || 'personal', user_id: user.id,
    }
    if (editGoal) {
      const { data, error } = await supabase.from('goals').update(payload).eq('id', editGoal.id).select().single()
      if (error) { toast.error('Ошибка сохранения'); setSaving(false); return }
      if (data) {
        setGoals(prev => prev.map(g => g.id === editGoal.id ? data : g))
        toast.success('Цель обновлена')
      }
    } else {
      const { data, error } = await supabase.from('goals').insert(payload).select().single()
      if (error) { toast.error('Ошибка сохранения'); setSaving(false); return }
      if (data) {
        setGoals(prev => [data, ...prev])
        toast.success('Цель добавлена!')
      }
    }
    setSaving(false)
    setModalOpen(false)
  }

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
    toast.success('Цель удалена')
  }

  const updateProgress = async (goal: Goal, newProgress: number) => {
    const { data } = await supabase.from('goals').update({ progress: newProgress }).eq('id', goal.id).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === goal.id ? data : g))
  }

  const filtered = goals.filter(g => g.period === activeTab)
  const tabGoals = {
    monthly: goals.filter(g => g.period === 'monthly'),
    quarterly: goals.filter(g => g.period === 'quarterly'),
    yearly: goals.filter(g => g.period === 'yearly'),
  }

  const tabs = [
    { key: 'monthly' as const, label: 'Месяц', emoji: '📅' },
    { key: 'quarterly' as const, label: 'Квартал', emoji: '📆' },
    { key: 'yearly' as const, label: 'Год', emoji: '🎯' },
  ]

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Цели"
        subtitle="Отслеживай прогресс по целям"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} /> Добавить
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Overall progress */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {tabs.map(tab => {
            const list = tabGoals[tab.key]
            const avg = list.length
              ? Math.round(list.reduce((s, g) => s + g.progress, 0) / list.length)
              : 0
            const completed = list.filter(g => g.status === 'completed').length
            return (
              <Card
                key={tab.key}
                hover
                onClick={() => setActiveTab(tab.key)}
                className={activeTab === tab.key ? 'ring-2 ring-primary-400' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{tab.emoji}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{tab.label}</span>
                    <Badge variant="default">{list.length}</Badge>
                  </div>
                  <Progress value={avg} showLabel />
                  <p className="text-xs text-gray-400 mt-1.5">{completed} завершено</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tab goals */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎯</p>
              <p className="text-gray-500 font-medium">Нет целей на {tabs.find(t => t.key === activeTab)?.label.toLowerCase()}</p>
              <Button className="mt-4" onClick={openCreate}>
                <Plus size={16} /> Добавить цель
              </Button>
            </div>
          ) : (
            filtered.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${goal.status === 'completed' ? 'text-green-500' : 'text-primary-400'}`}>
                      <Target size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{goal.title}</h3>
                        <Badge variant={
                          goal.status === 'completed' ? 'success' :
                          goal.status === 'paused' ? 'warning' : 'purple'
                        }>
                          {goal.status === 'completed' ? 'Выполнена' : goal.status === 'paused' ? 'Пауза' : 'Активна'}
                        </Badge>
                        {goal.target_date && (
                          <span className="text-xs text-gray-400">до {formatDate(goal.target_date)}</span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <Progress value={goal.progress} className="flex-1" showLabel />
                      </div>
                      {/* Progress slider */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={goal.progress}
                        onChange={(e) => updateProgress(goal, parseInt(e.target.value))}
                        className="w-full mt-2 accent-primary-600"
                      />
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(goal)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? 'Редактировать цель' : 'Новая цель'}>
        <div className="space-y-4">
          <Input label="Название цели" placeholder="Достичь..." value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Описание" placeholder="Подробнее..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Период" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} options={periodOptions} />
            <Select label="Статус" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} options={statusOptions} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Целевая дата" type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} />
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                Прогресс: {form.progress}%
              </label>
              <input
                type="range" min={0} max={100} value={form.progress}
                onChange={e => setForm(p => ({ ...p, progress: e.target.value }))}
                className="w-full accent-primary-600"
              />
            </div>
          </div>
          <Input label="Категория" placeholder="Здоровье, Бизнес..." value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={saveGoal}>{editGoal ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
