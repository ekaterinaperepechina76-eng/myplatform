'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  name: string
  income: number
  expense: number
}

interface Props {
  data: ChartData[]
  formatCurrency: (n: number) => string
}

export default function FinancesChart({ data, formatCurrency }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            name === 'income' ? 'Доход' : 'Расход',
          ]}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
