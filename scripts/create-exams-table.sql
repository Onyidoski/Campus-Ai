-- ============================================================
-- CREATE EXAMS TABLE
-- ============================================================
-- Stores university-managed exam timetable entries imported by
-- admins from official timetable PDFs or entered manually later.
--
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

CREATE TABLE IF NOT EXISTS exams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  exam_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  venue TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exams_course_date
  ON exams(course_id, exam_date);

CREATE INDEX IF NOT EXISTS idx_exams_level_date
  ON exams(level, exam_date);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view exams" ON exams;
CREATE POLICY "Authenticated users can view exams"
  ON exams FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can create exams" ON exams;
CREATE POLICY "Admins can create exams"
  ON exams FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update exams" ON exams;
CREATE POLICY "Admins can update exams"
  ON exams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete exams" ON exams;
CREATE POLICY "Admins can delete exams"
  ON exams FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
