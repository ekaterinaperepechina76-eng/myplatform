'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BookOpen, DollarSign, Users, Target, CheckSquare, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

interface BusinessPageProps {
  businessId: 'flueng' | 'sokl'
  name: string
  description: string
  color: string
}

const menuItems = (id: string) => [
  { href: `/${id}/knowledge`, label: 'База знаний', icon: <BookOpen size={20} />, description: 'Документы, файлы, папки', emoji: '📚', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  { href: `/${id}/finances`, label: 'Финансы', icon: <DollarSign size={20} />, description: 'Доходы и расходы', emoji: '💰', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
  { href: `/${id}/crm`, label: 'CRM', icon: <Users size={20} />, description: 'Клиенты и контакты', emoji: '👥', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  { href: `/${id}/goals`, label: 'Цели', icon: <Target size={20} />, description: 'Бизнес-цели', emoji: '🎯', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  { href: `/${id}/tasks`, label: 'Задачи', icon: <CheckSquare size={20} />, description: 'Рабочие задачи', emoji: '✅', color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
]

export function BusinessPage({ businessId, name, description, color }: BusinessPageProps) {
  const items = menuItems(businessId)

  return (
    <div className="flex flex-col flex-1">
      <Header title={name} subtitle={description} />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Hero */}
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${color}dd, ${color}99)` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
              {name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{name}</h2>
              <p className="text-white/70 text-sm">{description}</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card hover className="group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</h3>
                      <p className="text-xs text-gray-400">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-primary-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Открыть <ArrowRight size={12} className="ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
