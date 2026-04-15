-- ===================================
-- Online Classes Table
-- ===================================
-- Stores scheduled online classes with Jitsi Meet room info.
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS online_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60 NOT NULL,
  room_name TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_online_classes_course ON online_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_online_classes_scheduled ON online_classes(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_online_classes_status ON online_classes(status);

-- RLS Policies
ALTER TABLE online_classes ENABLE ROW LEVEL SECURITY;

-- Everyone can read classes (access control handled at app level via enrollment checks)
CREATE POLICY "Anyone can read online classes"
  ON online_classes FOR SELECT
  USING (true);

-- Only the creator (lecturer) can insert
CREATE POLICY "Lecturers can create classes"
  ON online_classes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can update (e.g., change status to live/ended)
CREATE POLICY "Creators can update own classes"
  ON online_classes FOR UPDATE
  USING (auth.uid() = created_by);

-- Only the creator can delete
CREATE POLICY "Creators can delete own classes"
  ON online_classes FOR DELETE
  USING (auth.uid() = created_by);
