'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { CalendarEvent } from '@/types'
import { Plus, ChevronLeft, ChevronRight, Clock, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, startOfWeek, endOfWeek, addMonths, subMonths
} from 'date-fns'
import {
  nowMoscow, formatMonthYearMoscow, formatTimeMoscow,
  formatShortDateMoscow, localInputToUtc
} from '@/lib/tz'
import { formatInTimeZone } from 'date-fns-tz'

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
const TZ = 'Europe/Moscow'

// Singleton outside component — создаётся один раз
const supabase = createClient()

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth()

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(() => nowMoscow())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    color: COLORS[0],
    type: 'event',
  })
  const [saving, setSaving] = useState(false)

  // ── Сетка календаря ──────────────────────────────────────────────────
  const calendarStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  // ── Загрузка событий ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const startStr = formatInTimeZone(startOfMonth(currentMonth), TZ, "yyyy-MM-dd'T'00:00:00xxx")
    const endStr   = formatInTimeZone(endOfMonth(currentMonth),   TZ, "yyyy-MM-dd'T'23:59:59xxx")
    supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', startStr)
      .lte('start_time', endStr)
      .order('start_time')
      .then(({ data, error }) => {
        if (error) console.error('Ошибка загрузки событий:', error)
        else setEvents(data || [])
      })
  }, [user, currentMonth])

  // ── Фильтрация событий по дню ─────────────────────────────────────────
  const getEventsForDay = useCallback(
    (day: Date) =>
      events.filter(e => {
        const evtMsk = formatInTimeZone(new Date(e.start_time), TZ, 'yyyy-MM-dd')
        return evtMsk === format(day, 'yyyy-MM-dd')
      }),
    [events]
  )

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : []

  // ── Открытие модала ──────────────────────────────────────────────────
  const openModal = (date?: Date) => {
    // Берём московскую дату в формате YYYY-MM-DD через formatInTimeZone
    const d = date || nowMoscow()
    const dateStr = formatInTimeZone(d, TZ, 'yyyy-MM-dd')
    setForm({
      title: '',
      description: '',
      start_time: `${dateStr}T09:00`,   // простая строка без date-fns format
      end_time:   `${dateStr}T10:00`,
      color: COLORS[0],
      type: 'event',
    })
    setModalOpen(true)
  }

  // ── Сохранение события ───────────────────────────────────────────────
  const saveEvent = async () => {
    // Явные проверки с обратной связью
    if (authLoading) {
      toast('Подождите, идёт загрузка...', { icon: '⏳' })
      return
    }
    if (!user) {
      toast.error('Не удалось определить пользователя. Попробуйте перезагрузить страницу.')
      return
    }
    if (!form.title.trim()) {
      toast.error('Введите название события')
      return
    }
    if (!form.start_time) {
      toast.error('Укажите время начала')
      return
    }

    setSaving(true)

    let startUtc: string
    let endUtc: string | null = null
    try {
      startUtc = localInputToUtc(form.start_time)
      endUtc   = form.end_time ? localInputToUtc(form.end_time) : null
    } catch (e) {
      toast.error('Неверный формат времени')
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id:     user.id,
        title:       form.title.trim(),
        description: form.description || null,
        start_time:  startUtc,
        end_time:    endUtc,
        color:       form.color,
        type:        form.type,
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      console.error('Supabase error (events insert):', error)
      toast.error(`Ошибка сохранения: ${error.message}`)
      return
    }

    if (data) {
      setEvents(prev =>
        [...prev, data].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      )
      toast.success('Событие добавлено!')
      setModalOpen(false)
    }
  }

  // ── Удаление события ─────────────────────────────────────────────────
  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      toast.error('Не удалось удалить событие')
    } else {
      setEvents(prev => prev.filter(e => e.id !== id))
      toast.success('Событие удалено')
    }
  }

  // ── UI ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Календарь"
        subtitle={formatMonthYearMoscow(currentMonth)}
        actions={
          <Button size="sm" onClick={() => openModal()}>
            <Plus size={16} /> Событие
          </Button>
        }
      />

      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* ── Сетка календаря ────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-5">
              {/* Навигация по месяцам */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {formatMonthYearMoscow(currentMonth)}
                </h2>
                <button
                  onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Заголовки дней недели */}
              <div className="grid grid-cols-7 mb-2">
                {weekDays.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              {/* Дни */}
              <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                {calendarDays.map((day) => {
                  const isToday = isSameDay(day, nowMoscow())
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                  const dayEvents = getEventsForDay(day)

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      onDoubleClick={() => openModal(day)}
                      className={`
                        relative p-1 md:p-1.5 rounded-lg md:rounded-xl min-h-[44px] md:min-h-[60px] text-left transition-all duration-150
                        ${isCurrentMonth ? '' : 'opacity-30'}
                        ${isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                        ${isToday ? 'font-bold' : ''}
                      `}
                    >
                      <span className={`
                        inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full text-xs md:text-sm
                        ${isToday ? 'bg-primary-600 text-white' : 'text-gray-700 dark:text-gray-300'}
                      `}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map(e => (
                          <div
                            key={e.id}
                            className="text-[10px] truncate px-1 py-0.5 rounded font-medium text-white"
                            style={{ backgroundColor: e.color }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{dayEvents.length - 2}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Боковая панель ─────────────────────────────────────────── */}
        <div className="w-full lg:w-72 lg:flex-shrink-0">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedDate ? formatShortDateMoscow(selectedDate) : 'Выберите день'}
                </h3>
                {selectedDate && (
                  <Button size="sm" variant="ghost" onClick={() => openModal(selectedDate)}>
                    <Plus size={14} />
                  </Button>
                )}
              </div>

              {selectedDate ? (
                selectedDayEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">Нет событий</p>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => openModal(selectedDate)}>
                      <Plus size={14} /> Добавить
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayEvents.map(event => (
                      <div
                        key={event.id}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 group"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{event.title}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              {formatTimeMoscow(event.start_time)}
                              {event.end_time && ` — ${formatTimeMoscow(event.end_time)}`}
                            </p>
                            {event.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-gray-400 text-center py-8">
                  Кликните на день чтобы увидеть события.<br />
                  Двойной клик — добавить событие.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ближайшие события */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Ближайшие</h3>
              {events.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">Нет событий в этом месяце</p>
              ) : (
                events.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">{event.title}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatShortDateMoscow(event.start_time)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Модал добавления события ──────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Новое событие">
        <div className="space-y-4">
          <Input
            label="Название *"
            placeholder="Название события"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            autoFocus
          />
          <Textarea
            label="Описание"
            placeholder="Подробности..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Начало *"
              type="datetime-local"
              value={form.start_time}
              onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
            />
            <Input
              label="Конец"
              type="datetime-local"
              value={form.end_time}
              onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
            />
          </div>
          <Select
            label="Тип"
            value={form.type}
            onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            options={[
              { value: 'event',    label: 'Событие' },
              { value: 'task',     label: 'Задача' },
              { value: 'reminder', label: 'Напоминание' },
            ]}
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Цвет</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Отмена
            </Button>
            <Button
              className="flex-1"
              loading={saving}
              onClick={saveEvent}
              disabled={saving || authLoading}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
