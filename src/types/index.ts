export type UserRole = 'owner' | 'employee' | 'viewer'
export type BusinessId = 'flueng' | 'sokl'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  icon: string
  frequency: 'daily' | 'weekly'
  target_days: number
  created_at: string
  updated_at: string
  logs?: HabitLog[]
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  notes: string | null
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string
  period: 'monthly' | 'quarterly' | 'yearly'
  target_date: string | null
  progress: number
  status: 'active' | 'completed' | 'paused'
  business_id: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  business_id: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string | null
  color: string
  type: 'event' | 'task' | 'reminder'
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  title: string
  description: string | null
  url: string | null
  price: number | null
  currency: string
  category: string
  priority: 'low' | 'medium' | 'high'
  status: 'wanted' | 'purchased' | 'removed'
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string | null
  type: 'note' | 'diary'
  tags: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  user_id: string
  title: string
  content: string | null
  type: 'post' | 'reel' | 'story' | 'idea' | 'funnel' | 'video' | 'podcast'
  status: 'draft' | 'scheduled' | 'published'
  scheduled_at: string | null
  platform: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface KbFolder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  business_id: string
  created_at: string
  children?: KbFolder[]
}

export interface KbFile {
  id: string
  user_id: string
  folder_id: string | null
  business_id: string
  name: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  created_at: string
}

export interface FinancialRecord {
  id: string
  user_id: string
  business_id: string
  type: 'income' | 'expense'
  amount: number
  currency: string
  category: string | null
  description: string | null
  date: string
  created_at: string
}

export interface CrmContact {
  id: string
  user_id: string
  business_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  status: 'lead' | 'prospect' | 'client' | 'inactive'
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}
