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
import { WishlistItem } from '@/types'
import { Plus, ExternalLink, Trash2, CheckCircle, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, WISHLIST_CATEGORIES } from '@/lib/utils'

const categoryOptions = WISHLIST_CATEGORIES.map(c => ({ value: c, label: c }))
const priorityOptions = [
  { value: 'high', label: '🔴 Высокий' },
  { value: 'medium', label: '🟡 Средний' },
  { value: 'low', label: '🟢 Низкий' },
]

export default function WishlistPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('wanted')
  const [form, setForm] = useState({
    title: '', description: '', url: '', price: '',
    currency: 'RUB', category: WISHLIST_CATEGORIES[0], priority: 'medium',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('wishlist_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  const saveItem = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('wishlist_items').insert({
      user_id: user.id,
      title: form.title, description: form.description || null,
      url: form.url || null,
      price: form.price ? parseFloat(form.price) : null,
      currency: form.currency,
      category: form.category, priority: form.priority,
    }).select().single()
    if (error) { toast.error('Ошибка сохранения'); setSaving(false); return }
    if (data) {
      setItems(prev => [data, ...prev])
      toast.success('Добавлено в вишлист! ⭐')
    }
    setSaving(false)
    setModalOpen(false)
    setForm({ title: '', description: '', url: '', price: '', currency: 'RUB', category: WISHLIST_CATEGORIES[0], priority: 'medium' })
  }

  const markPurchased = async (item: WishlistItem) => {
    const newStatus = item.status === 'purchased' ? 'wanted' : 'purchased'
    const { data } = await supabase.from('wishlist_items').update({ status: newStatus }).eq('id', item.id).select().single()
    if (data) {
      setItems(prev => prev.map(i => i.id === item.id ? data : i))
      if (newStatus === 'purchased') toast.success('Куплено! 🎉')
    }
  }

  const deleteItem = async (id: string) => {
    await supabase.from('wishlist_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    toast.success('Удалено')
  }

  const categories = ['all', ...WISHLIST_CATEGORIES]
  const filtered = items.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (filterCat !== 'all' && i.category !== filterCat) return false
    return true
  })

  const totalWanted = items.filter(i => i.status === 'wanted' && i.price).reduce((s, i) => s + (i.price || 0), 0)

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Вишлист"
        subtitle="Список желаний"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Добавить
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.filter(i => i.status === 'wanted').length}</p>
            <p className="text-xs text-gray-500 mt-1">Хочу купить</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{items.filter(i => i.status === 'purchased').length}</p>
            <p className="text-xs text-gray-500 mt-1">Куплено</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalWanted)}</p>
            <p className="text-xs text-gray-500 mt-1">Сумма</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {['wanted', 'purchased', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === s
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {s === 'wanted' ? 'Хочу' : s === 'purchased' ? 'Куплено' : 'Все'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.slice(0, 6).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filterCat === cat
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? 'Все' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-gray-500 font-medium">Вишлист пуст</p>
            <Button className="mt-4" onClick={() => setModalOpen(true)}><Plus size={16} /> Добавить желание</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((item) => (
              <Card key={item.id} className={item.status === 'purchased' ? 'opacity-70' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      item.status === 'purchased' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-primary-50 dark:bg-primary-900/20'
                    }`}>
                      {item.status === 'purchased' ? '✅' : '⭐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${item.status === 'purchased' ? 'line-through text-gray-400' : ''}`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="default">{item.category}</Badge>
                        <Badge variant={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'success'}>
                          {item.priority === 'high' ? 'Высокий' : item.priority === 'medium' ? 'Средний' : 'Низкий'}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{item.description}</p>
                      )}
                      {item.price && (
                        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-2">
                          {formatCurrency(item.price, item.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <Button
                      size="sm"
                      variant={item.status === 'purchased' ? 'secondary' : 'outline'}
                      className="flex-1"
                      onClick={() => markPurchased(item)}
                    >
                      <CheckCircle size={14} />
                      {item.status === 'purchased' ? 'Возернуть' : 'Куплено'}
                    </Button>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost"><ExternalLink size={14} /></Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Добавить в вишлист">
        <div className="space-y-4">
          <Input label="Название" placeholder="Что хочешь?" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea label="Описание" placeholder="Подробнее..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
          <Input label="Ссылка" type="url" placeholder="https://..." value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Цена" type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            <Select label="Валюта" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              options={[{ value: 'RUB', label: '₽ Рубли' }, { value: 'USD', label: '$ Доллары' }, { value: 'EUR', label: '€ Евро' }]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Категория" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} options={categoryOptions} />
            <Select label="Приоритет" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} options={priorityOptions} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={saveItem}>Добавить</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
