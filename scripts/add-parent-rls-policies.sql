-- =============================================================
-- ADD RLS POLICIES FOR PARENT ACCESS
-- =============================================================
-- Parents who are linked to a student (via parent_student_links
-- with status = 'approved') should be able to read the student's:
--   - enrollments
--   - submissions
--
-- Note: courses, assignments, profiles, and materials already use
-- the broad "authenticated" SELECT policy, so they work for parents.
-- However, submissions and enrollments may need explicit parent policies.
-- =============================================================

-- Run this in: Supabase Dashboard → SQL Editor → New query


-- ============================================================
-- 1. ENROLLMENTS - Allow parents to read linked students' enrollments
-- ============================================================
-- The "Authenticated users can view enrollments" policy should already
-- cover this, but in case it was not applied or was removed:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'enrollments' 
    AND policyname = 'Parents can view linked student enrollments'
  ) THEN
    CREATE POLICY "Parents can view linked student enrollments"
      ON enrollments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM parent_student_links
          WHERE parent_student_links.parent_id = auth.uid()
          AND parent_student_links.student_id = enrollments.student_id
          AND parent_student_links.status = 'approved'
        )
      );
  END IF;
END $$;


-- ============================================================
-- 2. SUBMISSIONS - Allow parents to read linked students' submissions
-- ============================================================
-- This is the CRITICAL missing policy. The existing policy only allows:
--   auth.uid() = student_id OR lecturer of the course
-- Parents are neither, so they see 0 submissions.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'submissions' 
    AND policyname = 'Parents can view linked student submissions'
  ) THEN
    CREATE POLICY "Parents can view linked student submissions"
      ON submissions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM parent_student_links
          WHERE parent_student_links.parent_id = auth.uid()
          AND parent_student_links.student_id = submissions.student_id
          AND parent_student_links.status = 'approved'
        )
      );
  END IF;
END $$;


-- ============================================================
-- 3. COURSES - Ensure parents can read courses (should already work)
-- ============================================================
-- The "Authenticated users can view all courses" policy covers this.
-- Adding an explicit one just in case:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'courses' 
    AND policyname = 'Parents can view courses'
  ) THEN
    CREATE POLICY "Parents can view courses"
      ON courses
      FOR SELECT
      USING (
        auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'parent'
        )
      );
  END IF;
END $$;


-- ============================================================
-- 4. ASSIGNMENTS - Ensure parents can read assignments
-- ============================================================
-- The "Authenticated users can view assignments" policy covers this.
-- Adding an explicit one just in case:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'assignments' 
    AND policyname = 'Parents can view assignments'
  ) THEN
    CREATE POLICY "Parents can view assignments"
      ON assignments
      FOR SELECT
      USING (
        auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'parent'
        )
      );
  END IF;
END $$;


-- ============================================================
-- DONE! Parents can now read their linked students' academic data.
-- ============================================================
-- After running this, verify in Supabase Dashboard → Authentication → Policies
-- that the new policies appear on the enrollments, submissions, courses,
-- and assignments tables.
-- ============================================================
