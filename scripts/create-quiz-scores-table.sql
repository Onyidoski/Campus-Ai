-- ===================================
-- Quiz Scores Table
-- ===================================
-- Stores quiz results so students can track their progress.
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS quiz_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_quiz_scores_user_course ON quiz_scores(user_id, course_id);

-- RLS: Users can only see and insert their own scores
ALTER TABLE quiz_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scores"
  ON quiz_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON quiz_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);
