-- Ensure blog_tasks table exists (may have been missed in 002)
CREATE TABLE IF NOT EXISTS blog_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE blog_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'blog_tasks' AND policyname = 'Users manage own blog_tasks'
  ) THEN
    CREATE POLICY "Users manage own blog_tasks" ON blog_tasks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Update blog_posts type constraint to include all content types
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_type_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_type_check
  CHECK (type IN ('post', 'reel', 'story', 'idea', 'funnel', 'video', 'podcast'));

-- Remove platform constraint if it exists (platforms are now free-form)
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_platform_check;
