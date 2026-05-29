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
import { FinancialRecord } from '@/types'
import { Plus, TrendingUp, TrendingDown, Trash2, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'
import { nowMoscow, formatMonthYearMoscow } from '@/lib/tz'
import { formatInTimeZone } from 'date-fns-tz'

import dynamic from 'next/dynamic'

const TZ = 'Europe/Moscow'

// Весь блок recharts загружается лениво — экономит ~90kB на начальной загрузке
const FinancesChart = dynamic(() => import('./FinancesChart'), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse" />,
})

interface FinancesSectionProps {
  businessId: string
  title: string
}

const incomeCategories = ['Продажи', 'Услуги', 'Партнёрство', 'Инвестиции', 'Другое'].map(v => ({ value: v, label: v }))
const expenseCategories = ['Реклама', 'Зарплаты', 'Аренда', 'Инструменты', 'Логистика', 'Другое'].map(v => ({ value: v, label: v }))

export function FinancesSection({ businessId, title }: FinancesSectionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [form, setForm] = useState({ type: 'income', amount: '', category: 'Продажи', description: '', date: formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd'), currency: 'RUB' })
  const [saving, setSaving] = useState(false)

  const nowMsk = nowMoscow()
  const currentMonthStart = formatInTimeZone(startOfMonth(nowMsk), TZ, 'yyyy-MM-dd')
  const currentMonthEnd   = formatInTimeZone(endOfMonth(nowMsk),   TZ, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('financial_records').select('*')
        .eq('user_id', user.id).eq('business_id', businessId)
        .order('date', { ascending: false })
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [user, businessId])

  const saveRecord = async () => {
    if (!user || !form.amount) return
    setSaving(true)
    const { data } = await supabase.from('financial_records').insert({
      user_id: user.id, business_id: businessId,
      type: form.type, amount: parseFloat(form.amount),
      category: form.category, description: form.description || null,
      date: form.date, currency: form.currency,
    }).select().single()
    if (data) {
      setRecords(prev => [data, ...prev])
      toast.success(form.type === 'income' ? 'Доход добавлен!' : 'Расход добавлен!')
    }
    setSaving(false)
    setModalOpen(false)
    setForm({ type: 'income', amount: '', category: 'Продажи', description: '', date: new Date().toISOString().split('T')[0], currency: 'RUB' })
  }

  const deleteRecord = async (id: string) => {
    await supabase.from('financial_records').delete().eq('id', id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const thisMonth = records.filter(r => r.date >= currentMonthStart && r.date <= currentMonthEnd)
  const totalIncome = thisMonth.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const totalExpense = thisMonth.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const profit = totalIncome - totalExpense

  const filtered = filterType === 'all' ? records : records.filter(r => r.type === filterType)

  // Chart data - last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(nowMsk, 5 - i)
    const start = formatInTimeZone(startOfMonth(month), TZ, 'yyyy-MM-dd')
    const end   = formatInTimeZone(endOfMonth(month),   TZ, 'yyyy-MM-dd')
    const monthRecords = records.filter(r => r.date >= start && r.date <= end)
    return {
      name: formatInTimeZone(month, TZ, 'MMM', { locale: ru }),
      income: monthRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0),
      expense: monthRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
    }
  })

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={title}
        subtitle="Финансовый учёт"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Добавить
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-xs text-gray-500">Доходы (месяц)</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-xs text-gray-500">Расходы (месяц)</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className={profit >= 0 ? 'text-primary-500' : 'text-red-500'} />
              <span className="text-xs text-gray-500">Прибыль (месяц)</span>
            </div>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-primary-600' : 'text-red-500'}`}>
              {formatCurrency(profit)}
            </p>
          </Card>
        </div>

        {/* Chart — динамический импорт */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Динамика за 6 месяцев</h3>
            <FinancesChart data={chartData} formatCurrency={formatCurrency} />
          </CardContent>
        </Card>

        {/* Filter & Records */}
        <div className="flex gap-2 mb-2">
          {['all', 'income', 'expense'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t as typeof filterType)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                filterType === t ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              {t === 'all' ? 'Все' : t === 'income' ? 'Доходы' : 'Расходы'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Загрузка...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">💰</p>
              <p className="text-gray-400 text-sm">Нет записей</p>
            </div>
          ) : (
            filtered.map(record => (
              <Card key={record.id}>
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      record.type === 'income' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      {record.type === 'income'
                        ? <TrendingUp size={16} className="text-green-500" />
                        : <TrendingDown size={16} className="text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {record.description || record.category}
                        </span>
                        <Badge variant="default">{record.category}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(record.date)}</p>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${record.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount, record.currency)}
                    </p>
                    <button onClick={() => deleteRecord(record.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Добавить запись">
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {[{ v: 'income', l: '📈 Доход' }, { v: 'expense', l: '📉 Расход' }].map(t => (
              <button
                key={t.v}
                onClick={() => setForm(p => ({ ...p, type: t.v, category: t.v === 'income' ? 'Продажи' : 'Реклама' }))}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${form.type === t.v ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
              >
                {t.l}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Сумма" type="number" placeholder="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
            <Select label="Валюта" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              options={[{ value: 'RUB', label: '₽ Рубли' }, { value: 'USD', label: '$ Доллары' }, { value: 'EUR', label: '€ Евро' }]}
            />
          </div>
          <Select
            label="Категория"
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            options={form.type === 'income' ? incomeCategories : expenseCategories}
          />
          <Input label="Описание" placeholder="Примечание..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <Input label="Дата" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={saveRecord}>Добавить</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
