-- Обновляем типы контента для блога (добавляем funnel, video, podcast)
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_type_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_type_check
  CHECK (type IN ('post', 'reel', 'story', 'idea', 'funnel', 'video', 'podcast'));

-- Обновляем список платформ
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_platform_check;

-- Таблица для задач контент-плана (еженедельный чеклист)
CREATE TABLE IF NOT EXISTS blog_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  week_start DATE NOT NULL, -- понедельник недели
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own blog_tasks" ON blog_tasks FOR ALL USING (auth.uid() = user_id);
