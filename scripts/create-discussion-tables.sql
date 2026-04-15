-- Discussion Forum Tables for Campus AI
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Discussion posts (questions/topics)
CREATE TABLE discussion_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Replies to discussion posts
CREATE TABLE discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- Read access
CREATE POLICY "Anyone can read discussion posts" ON discussion_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can read discussion replies" ON discussion_replies FOR SELECT USING (true);

-- Insert access
CREATE POLICY "Authenticated users can create posts" ON discussion_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authenticated users can create replies" ON discussion_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Delete access (own content only)
CREATE POLICY "Authors can delete own posts" ON discussion_posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own replies" ON discussion_replies FOR DELETE USING (auth.uid() = author_id);

-- Update access (for marking answered/accepted)
CREATE POLICY "Authors can update own posts" ON discussion_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can update own replies" ON discussion_replies FOR UPDATE USING (auth.uid() = author_id);

-- 4. Enable Realtime (so replies appear instantly for all viewers)
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE discussion_posts;
