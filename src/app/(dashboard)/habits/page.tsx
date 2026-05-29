'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Habit, HabitLog } from '@/types'
import { HABIT_COLORS, HABIT_ICONS } from '@/lib/utils'
import { Plus, Check, Flame, Trophy, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { todayMoscow, nowMoscow, formatMonthYearMoscow } from '@/lib/tz'

export default function HabitsPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: HABIT_COLORS[0], icon: HABIT_ICONS[0] })
  const [saving, setSaving] = useState(false)
  // Сегодняшняя дата по московскому времени (UTC+3)
  const today = todayMoscow()
  const nowMsk = nowMoscow()

  const monthDays = eachDayOfInterval({
    start: startOfMonth(nowMsk),
    end: endOfMonth(nowMsk),
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('habit_logs').select('*').eq('user_id', user.id)
          .gte('completed_at', format(startOfMonth(nowMsk), 'yyyy-MM-dd'))
          .lte('completed_at', format(endOfMonth(nowMsk), 'yyyy-MM-dd')),
      ])
      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const isCompletedToday = (habitId: string) =>
    logs.some(l => l.habit_id === habitId && l.completed_at === today)

  const isCompletedOn = (habitId: string, date: Date) =>
    logs.some(l => l.habit_id === habitId && l.completed_at === format(date, 'yyyy-MM-dd'))

  const getStreak = (habitId: string) => {
    let streak = 0
    const d = nowMoscow() // начинаем с сегодня по Москве
    while (true) {
      const dateStr = format(d, 'yyyy-MM-dd')
      if (logs.some(l => l.habit_id === habitId && l.completed_at === dateStr)) {
        streak++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return streak
  }

  const toggleHabit = async (habit: Habit) => {
    if (!user) return
    const completed = isCompletedToday(habit.id)
    if (completed) {
      const log = logs.find(l => l.habit_id === habit.id && l.completed_at === today)
      if (log) {
        await supabase.from('habit_logs').delete().eq('id', log.id)
        setLogs(prev => prev.filter(l => l.id !== log.id))
        toast('Отметка снята', { icon: '↩️' })
      }
    } else {
      const { data } = await supabase.from('habit_logs').insert({
        habit_id: habit.id,
        user_id: user.id,
        completed_at: today,
      }).select().single()
      if (data) {
        setLogs(prev => [...prev, data])
        toast.success(`${habit.icon} ${habit.name} выполнено!`)
      }
    }
  }

  const saveHabit = async () => {
    if (!user || !form.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('habits').insert({
      user_id: user.id,
      name: form.name,
      description: form.description || null,
      color: form.color,
      icon: form.icon,
    }).select().single()
    if (error) { toast.error('Ошибка'); setSaving(false); return }
    setHabits(prev => [...prev, data])
    setForm({ name: '', description: '', color: HABIT_COLORS[0], icon: HABIT_ICONS[0] })
    setModalOpen(false)
    toast.success('Привычка добавлена!')
    setSaving(false)
  }

  const deleteHabit = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id)
    setHabits(prev => prev.filter(h => h.id !== id))
    toast.success('Привычка удалена')
  }

  const completedToday = habits.filter(h => isCompletedToday(h.id)).length

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Трекер привычек"
        subtitle={formatMonthYearMoscow(nowMsk)}
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Добавить
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-primary-600">{completedToday}</p>
            <p className="text-xs text-gray-500 mt-1">Выполнено сегодня</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{habits.length}</p>
            <p className="text-xs text-gray-500 mt-1">Всего привычек</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">
              {habits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Лучший стрик</p>
          </Card>
        </div>

        {/* Habits list */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Загрузка...</div>
          ) : habits.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">💪</p>
              <p className="text-gray-500 font-medium">Нет привычек</p>
              <p className="text-gray-400 text-sm mt-1">Добавьте первую привычку для отслеживания</p>
              <Button className="mt-4" onClick={() => setModalOpen(true)}>
                <Plus size={16} /> Добавить привычку
              </Button>
            </div>
          ) : (
            habits.map((habit) => {
              const streak = getStreak(habit.id)
              const completedThisMonth = monthDays.filter(d => isCompletedOn(habit.id, d)).length
              const rate = Math.round((completedThisMonth / monthDays.length) * 100)
              const done = isCompletedToday(habit.id)

              return (
                <Card key={habit.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Toggle button */}
                      <button
                        onClick={() => toggleHabit(habit)}
                        className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-200 shadow-sm"
                        style={{
                          backgroundColor: done ? habit.color : undefined,
                          border: done ? 'none' : `2px solid ${habit.color}30`,
                        }}
                      >
                        {done ? <Check className="text-white" size={22} /> : habit.icon}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{habit.name}</h3>
                          {streak > 0 && (
                            <Badge variant="warning" className="flex items-center gap-0.5">
                              <Flame size={10} /> {streak}
                            </Badge>
                          )}
                          {done && <Badge variant="success">✓ Выполнено</Badge>}
                        </div>
                        {habit.description && (
                          <p className="text-xs text-gray-400 mb-3">{habit.description}</p>
                        )}

                        {/* Monthly calendar */}
                        <div className="flex flex-wrap gap-0.5 md:gap-1 mt-2">
                          {monthDays.map((day) => {
                            const isToday = isSameDay(day, nowMsk)
                            const completed = isCompletedOn(habit.id, day)
                            const isPast = day <= nowMsk
                            return (
                              <div
                                key={day.toISOString()}
                                title={format(day, 'd MMMM', { locale: ru })}
                                className={`w-5 h-5 rounded-md transition-all duration-200 ${
                                  completed
                                    ? 'opacity-100'
                                    : isPast
                                    ? 'bg-gray-100 dark:bg-gray-800'
                                    : 'bg-gray-50 dark:bg-gray-900 opacity-40'
                                } ${isToday ? 'ring-2 ring-offset-1' : ''}`}
                                style={{
                                  backgroundColor: completed ? habit.color : undefined,
                                  outline: isToday ? `2px solid ${habit.color}` : undefined,
                                  outlineOffset: '2px',
                                }}
                              />
                            )
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {completedThisMonth} из {monthDays.length} дней ({rate}%)
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => deleteHabit(habit.id)}
                        className="text-gray-300 hover:text-red-400 dark:text-gray-700 dark:hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Add habit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Новая привычка">
        <div className="space-y-4">
          <Input
            label="Название"
            placeholder="Например: Читать 30 минут"
            value={form.name}
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Textarea
            label="Описание (опционально)"
            placeholder="Зачем эта привычка?"
            value={form.description}
            onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Иконка</label>
            <div className="flex flex-wrap gap-2">
              {HABIT_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    form.icon === icon
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-400'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Цвет</label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm(p => ({ ...p, color }))}
                  className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={saveHabit}>Создать</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
