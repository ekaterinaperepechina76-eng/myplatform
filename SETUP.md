# MyPlatform — Инструкция по запуску

## 1. Настройка базы данных Supabase

Перейдите в [Supabase Dashboard](https://supabase.com/dashboard/project/ikgztjqjlxqlyribicok) → SQL Editor и выполните файл `supabase/migrations/001_initial.sql`.

Скопируйте содержимое файла целиком и нажмите **Run**.

Это создаст:
- Все таблицы (profiles, habits, goals, tasks, events, и т.д.)
- Row Level Security политики
- Триггер для автосоздания профиля при регистрации
- Bucket для хранения файлов

## 2. Запуск проекта

```bash
npm run dev
```

Откройте http://localhost:3000

## 3. Первый вход

1. Перейдите на /register
2. Создайте аккаунт
3. При необходимости подтвердите email (или отключите подтверждение в Supabase Auth Settings)

## Отключение подтверждения email (для разработки)

Supabase Dashboard → Authentication → Providers → Email → отключить "Confirm email"

## Структура проекта

```
src/
  app/
    (auth)/login, register     — авторизация
    (dashboard)/
      dashboard/               — главная страница
      flueng/, sokl/           — бизнес-разделы
      habits/                  — трекер привычек
      goals/                   — цели
      calendar/                — календарь
      wishlist/                — вишлист
      blog/                    — блог/контент
      notes/                   — заметки/дневник
  components/
    layout/Sidebar, Header     — навигация
    ui/                        — UI компоненты
    features/                  — компоненты разделов
  lib/supabase/                — Supabase клиент
  types/                       — TypeScript типы
```
