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
import { Plus, Target, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FluengGoalsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState({ title: '', description: '', period: 'monthly', target_date: '', progress: '0', status: 'active' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('goals').select('*').eq('user_id', user.id).eq('business_id', 'flueng')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setGoals(data || []); setLoading(false) })
  }, [user])

  const saveGoal = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const payload = { title: form.title, description: form.description || null, period: form.period as Goal['period'], target_date: form.target_date || null, progress: parseInt(form.progress) || 0, status: form.status as Goal['status'], business_id: 'flueng', user_id: user.id, category: 'business' }
    if (editGoal) {
      const { data } = await supabase.from('goals').update(payload).eq('id', editGoal.id).select().single()
      if (data) { setGoals(prev => prev.map(g => g.id === editGoal.id ? data : g)); toast.success('Обновлено') }
    } else {
      const { data } = await supabase.from('goals').insert(payload).select().single()
      if (data) { setGoals(prev => [data, ...prev]); toast.success('Цель добавлена!') }
    }
    setSaving(false); setModalOpen(false)
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="FLUENG — Цели" subtitle="Бизнес-цели FLUENG" actions={<Button size="sm" onClick={() => { setEditGoal(null); setForm({ title: '', description: '', period: 'monthly', target_date: '', progress: '0', status: 'active' }); setModalOpen(true) }}><Plus size={16} /> Цель</Button>} />
      <div className="p-6 space-y-3">
        {goals.map(goal => (
          <Card key={goal.id}><CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target size={18} className="text-primary-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{goal.title}</span>
                  <Badge variant={goal.period === 'yearly' ? 'purple' : goal.period === 'quarterly' ? 'info' : 'success'}>{goal.period === 'monthly' ? 'Месяц' : goal.period === 'quarterly' ? 'Квартал' : 'Год'}</Badge>
                </div>
                <Progress value={goal.progress} showLabel />
                <input type="range" min={0} max={100} value={goal.progress}
                  onChange={async (e) => {
                    const v = parseInt(e.target.value)
                    const { data } = await supabase.from('goals').update({ progress: v }).eq('id', goal.id).select().single()
                    if (data) setGoals(prev => prev.map(g => g.id === goal.id ? data : g))
                  }}
                  className="w-full mt-2 accent-primary-600"
                />
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditGoal(goal); setForm({ title: goal.title, description: goal.description || '', period: goal.period, target_date: goal.target_date || '', progress: goal.progress.toString(), status: goal.status }); setModalOpen(true) }} className="p-1.5 rounded text-gray-400 hover:text-primary-500"><Edit2 size={14} /></button>
                <button onClick={async () => { await supabase.from('goals').delete().eq('id', goal.id); setGoals(prev => prev.filter(g => g.id !== goal.id)) }} className="p-1.5 rounded text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          </CardContent></Card>
        ))}
        {!loading && goals.length === 0 && (
          <div className="text-center py-16"><p className="text-4xl mb-3">🎯</p><p className="text-gray-500">Нет целей для FLUENG</p><Button className="mt-4" onClick={() => setModalOpen(true)}><Plus size={16} /> Добавить цель</Button></div>
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editGoal ? 'Редактировать' : 'Новая цель'}>
        <div className="space-y-4">
          <Input label="Название" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Описание" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Период" value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} options={[{ value: 'monthly', label: 'Месяц' }, { value: 'quarterly', label: 'Квартал' }, { value: 'yearly', label: 'Год' }]} />
            <Input label="Срок" type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} />
          </div>
          <div className="flex gap-3"><Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button><Button className="flex-1" loading={saving} onClick={saveGoal}>{editGoal ? 'Сохранить' : 'Создать'}</Button></div>
        </div>
      </Modal>
    </div>
  )
}
