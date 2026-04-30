-- ============================================================
-- ADD ADMIN RLS POLICIES FOR COURSES TABLE
-- ============================================================
-- The existing policy "Lecturers can create courses" only allows
-- inserts where auth.uid() = lecturer_id. Admins need to create
-- courses with a different lecturer_id (or null), so they need
-- separate policies.
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Admins can create any course (even with a different lecturer_id)
CREATE POLICY "Admins can create courses"
  ON courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update any course (e.g. reassign lecturer)
CREATE POLICY "Admins can update any course"
  ON courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete any course
CREATE POLICY "Admins can delete any course"
  ON courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
