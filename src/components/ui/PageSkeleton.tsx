import { Skeleton, SkeletonCard, SkeletonRow, SkeletonStats } from './Skeleton'

// ── Шапка-скелетон (общая для всех страниц) ────────────────────────────────
export function HeaderSkeleton({ hasAction = true }: { hasAction?: boolean }) {
  return (
    <div className="h-14 md:h-16 px-4 md:px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-5 lg:hidden" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-20 hidden sm:block" />
        </div>
      </div>
      {hasAction && <Skeleton className="h-8 w-24 rounded-xl" />}
    </div>
  )
}

// ── Дашборд ─────────────────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton hasAction={false} />
      <div className="p-4 md:p-6 space-y-5">
        <Skeleton className="h-28 md:h-24 w-full rounded-2xl" />
        <SkeletonStats count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="p-5 space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Привычки ─────────────────────────────────────────────────────────────────
export function HabitsSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="p-4 md:p-6 space-y-5">
        <SkeletonStats count={3} />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-40" />
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 28 }).map((_, j) => (
                    <Skeleton key={j} className="w-5 h-5 rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Цели ─────────────────────────────────────────────────────────────────────
export function GoalsSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="p-4 md:p-6 space-y-5">
        <SkeletonStats count={3} />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-20 rounded-xl" />)}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Календарь ────────────────────────────────────────────────────────────────
export function CalendarSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-12 md:h-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="w-full lg:w-72 space-y-3">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Заметки ──────────────────────────────────────────────────────────────────
export function NotesSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-72 border-r border-gray-100 dark:border-gray-800 p-3 space-y-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-2.5 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          ))}
        </div>
        <div className="flex-1 p-8 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-3 w-1/4" />
          <div className="space-y-2 mt-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Карточки (вишлист, блог, CRM) ────────────────────────────────────────────
export function CardGridSkeleton({ count = 6, hasStats = true }: { count?: number; hasStats?: boolean }) {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="p-4 md:p-6 space-y-5">
        {hasStats && <SkeletonStats count={3} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}

// ── Бизнес-страница ───────────────────────────────────────────────────────────
export function BusinessSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton hasAction={false} />
      <div className="p-4 md:p-6 space-y-5">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    </div>
  )
}

// ── Задачи (kanban) ──────────────────────────────────────────────────────────
export function TasksSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="p-4 md:p-6 space-y-5">
        <SkeletonStats count={3} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(col => (
            <div key={col} className="space-y-3">
              <Skeleton className="h-5 w-24" />
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Финансы ──────────────────────────────────────────────────────────────────
export function FinancesSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <HeaderSkeleton />
      <div className="p-4 md:p-6 space-y-5">
        <SkeletonStats count={3} />
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
