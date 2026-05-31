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
import { CrmContact } from '@/types'
import { Plus, Phone, Mail, Building, Trash2, Edit2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getInitials } from '@/lib/utils'

interface CRMSectionProps { businessId: string; title: string }

const statusConfig = {
  lead: { label: 'Лид', color: 'default' as const, bg: 'bg-gray-100 dark:bg-gray-800' },
  prospect: { label: 'Перспектива', color: 'info' as const, bg: 'bg-blue-50 dark:bg-blue-900/20' },
  client: { label: 'Клиент', color: 'success' as const, bg: 'bg-green-50 dark:bg-green-900/20' },
  inactive: { label: 'Неактивный', color: 'warning' as const, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
}

export function CRMSection({ businessId, title }: CRMSectionProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState<CrmContact | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', status: 'lead', notes: '', tags: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await supabase.from('crm_contacts').select('*')
        .eq('user_id', user.id).eq('business_id', businessId).order('created_at', { ascending: false })
      setContacts(data || [])
      setLoading(false)
    }
    load()
  }, [user, businessId])

  const saveContact = async () => {
    if (!user || !form.name.trim()) return
    setSaving(true)
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const payload = {
      name: form.name, email: form.email || null, phone: form.phone || null,
      company: form.company || null, status: form.status as CrmContact['status'],
      notes: form.notes || null, tags, business_id: businessId, user_id: user.id,
    }
    if (editContact) {
      const { data, error } = await supabase.from('crm_contacts').update(payload).eq('id', editContact.id).select().single()
      if (error) { toast.error('Ошибка сохранения'); setSaving(false); return }
      if (data) { setContacts(prev => prev.map(c => c.id === editContact.id ? data : c)); toast.success('Обновлено') }
    } else {
      const { data, error } = await supabase.from('crm_contacts').insert(payload).select().single()
      if (error) { toast.error('Ошибка сохранения'); setSaving(false); return }
      if (data) { setContacts(prev => [data, ...prev]); toast.success('Контакт добавлен!') }
    }
    setSaving(false)
    setModalOpen(false)
  }

  const deleteContact = async (id: string) => {
    await supabase.from('crm_contacts').delete().eq('id', id)
    setContacts(prev => prev.filter(c => c.id !== id))
    toast.success('Удалено')
  }

  const openEdit = (c: CrmContact) => {
    setEditContact(c)
    setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', status: c.status, notes: c.notes || '', tags: c.tags?.join(', ') || '' })
    setModalOpen(true)
  }

  const filtered = contacts.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase()) && !c.company?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const statusCounts = Object.keys(statusConfig).reduce((acc, key) => ({
    ...acc, [key]: contacts.filter(c => c.status === key).length
  }), {} as Record<string, number>)

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={title}
        subtitle="Управление контактами и клиентами"
        actions={
          <Button size="sm" onClick={() => { setEditContact(null); setForm({ name: '', email: '', phone: '', company: '', status: 'lead', notes: '', tags: '' }); setModalOpen(true) }}>
            <Plus size={16} /> Контакт
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {(Object.entries(statusConfig) as [keyof typeof statusConfig, typeof statusConfig[keyof typeof statusConfig]][]).map(([key, cfg]) => (
            <Card key={key} hover onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)} className={filterStatus === key ? 'ring-2 ring-primary-400' : ''}>
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{statusCounts[key] || 0}</p>
                <Badge variant={cfg.color}>{cfg.label}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Поиск по имени, email, компании..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        {/* Contacts */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 font-medium">Нет контактов</p>
            <Button className="mt-4" onClick={() => { setEditContact(null); setModalOpen(true) }}><Plus size={16} /> Добавить контакт</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((contact) => (
              <Card key={contact.id} hover>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getInitials(contact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{contact.name}</h3>
                        <Badge variant={statusConfig[contact.status].color}>{statusConfig[contact.status].label}</Badge>
                      </div>
                      {contact.company && (
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Building size={10} />{contact.company}</p>
                      )}
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="text-xs text-primary-500 hover:underline flex items-center gap-1 mt-0.5">
                          <Mail size={10} />{contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} />{contact.phone}
                        </a>
                      )}
                      {contact.tags?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {contact.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(contact)}>
                      <Edit2 size={13} /> Редактировать
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteContact(contact.id)} className="text-red-400 hover:text-red-500">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editContact ? 'Редактировать контакт' : 'Новый контакт'}>
        <div className="space-y-4">
          <Input label="Имя" placeholder="Имя контакта" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <Input label="Телефон" type="tel" placeholder="+7..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Компания" placeholder="Название компании" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            <Select label="Статус" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              options={[{ value: 'lead', label: 'Лид' }, { value: 'prospect', label: 'Перспектива' }, { value: 'client', label: 'Клиент' }, { value: 'inactive', label: 'Неактивный' }]}
            />
          </div>
          <Input label="Теги" placeholder="продажи, B2B..." value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          <Textarea label="Заметки" placeholder="Дополнительная информация..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button className="flex-1" loading={saving} onClick={saveContact}>{editContact ? 'Сохранить' : 'Добавить'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
