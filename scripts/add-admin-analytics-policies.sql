-- ============================================================
-- ADD ADMIN READ POLICIES FOR ANALYTICS
-- ============================================================
-- Admin analytics needs to count enrollments and submissions across
-- the whole platform. If RLS only allows students to view their own
-- rows, admin charts can show 0 even when students are enrolled.
--
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all submissions" ON submissions;
CREATE POLICY "Admins can view all submissions"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

