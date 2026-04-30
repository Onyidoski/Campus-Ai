-- ============================================================
-- ENABLE ROW-LEVEL SECURITY (RLS) FOR ALL TABLES
-- ============================================================
-- This script fixes the Supabase security warnings:
--   1. "Table publicly accessible" (rls_disabled_in_public)
--   2. "Sensitive data publicly accessible" (sensitive_columns_exposed)
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
-- Contains: id, full_name, email, role, academic_level, department
-- Sensitive: email, full_name (personal identifiers)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all profiles (needed for showing names in enrollments, discussions, etc.)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profile is created automatically via trigger on auth.users signup
-- Allow insert only for the user's own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- 2. COURSES TABLE
-- ============================================================
-- Contains: id, code, title, description, level, lecturer_id, invite_code
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all courses (needed for course browsing & enrollment)
CREATE POLICY "Authenticated users can view all courses"
  ON courses FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the lecturer (owner) can create courses
CREATE POLICY "Lecturers can create courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = lecturer_id);

-- Only the lecturer can update their own courses
CREATE POLICY "Lecturers can update own courses"
  ON courses FOR UPDATE
  USING (auth.uid() = lecturer_id);

-- Only the lecturer can delete their own courses
CREATE POLICY "Lecturers can delete own courses"
  ON courses FOR DELETE
  USING (auth.uid() = lecturer_id);


-- ============================================================
-- 3. ENROLLMENTS TABLE
-- ============================================================
-- Contains: id, course_id, student_id, enrolled_at
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view enrollments (needed for course rosters, checking enrollment status)
CREATE POLICY "Authenticated users can view enrollments"
  ON enrollments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Students can enroll themselves
CREATE POLICY "Students can enroll themselves"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can unenroll themselves
CREATE POLICY "Students can unenroll themselves"
  ON enrollments FOR DELETE
  USING (auth.uid() = student_id);


-- ============================================================
-- 4. MATERIALS TABLE
-- ============================================================
-- Contains: id, course_id, uploader_id, title, file_url, file_type, created_at
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all materials (students need to access course materials)
CREATE POLICY "Authenticated users can view materials"
  ON materials FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the uploader (lecturer) can insert materials
CREATE POLICY "Uploaders can add materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

-- Only the uploader can delete their materials
CREATE POLICY "Uploaders can delete own materials"
  ON materials FOR DELETE
  USING (auth.uid() = uploader_id);

-- Only the uploader can update their materials
CREATE POLICY "Uploaders can update own materials"
  ON materials FOR UPDATE
  USING (auth.uid() = uploader_id);


-- ============================================================
-- 5. ASSIGNMENTS TABLE
-- ============================================================
-- Contains: id, course_id, title, description, due_date, attachment_url, created_at
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view assignments
CREATE POLICY "Authenticated users can view assignments"
  ON assignments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only lecturers who own the course can create assignments
-- (We check via the courses table that the user is the lecturer)
CREATE POLICY "Course lecturers can create assignments"
  ON assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.lecturer_id = auth.uid()
    )
  );

-- Course lecturers can update assignments
CREATE POLICY "Course lecturers can update assignments"
  ON assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.lecturer_id = auth.uid()
    )
  );

-- Course lecturers can delete assignments
CREATE POLICY "Course lecturers can delete assignments"
  ON assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = assignments.course_id
      AND courses.lecturer_id = auth.uid()
    )
  );


-- ============================================================
-- 6. SUBMISSIONS TABLE
-- ============================================================
-- Contains: id, assignment_id, student_id, file_url, grade, feedback, submitted_at
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
-- Lecturers can view submissions for their courses
CREATE POLICY "Users can view relevant submissions"
  ON submissions FOR SELECT
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM assignments
      JOIN courses ON courses.id = assignments.course_id
      WHERE assignments.id = submissions.assignment_id
      AND courses.lecturer_id = auth.uid()
    )
  );

-- Students can submit their own work
CREATE POLICY "Students can create own submissions"
  ON submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own submissions (resubmit)
-- Lecturers can update submissions to grade them
CREATE POLICY "Students and lecturers can update submissions"
  ON submissions FOR UPDATE
  USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM assignments
      JOIN courses ON courses.id = assignments.course_id
      WHERE assignments.id = submissions.assignment_id
      AND courses.lecturer_id = auth.uid()
    )
  );


-- ============================================================
-- 7. ANNOUNCEMENTS TABLE
-- ============================================================
-- Contains: id, course_id, lecturer_id, content, is_urgent, created_at
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view announcements
CREATE POLICY "Authenticated users can view announcements"
  ON announcements FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only the lecturer who made the announcement can insert
CREATE POLICY "Lecturers can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (auth.uid() = lecturer_id);

-- Only the author can update announcements
CREATE POLICY "Lecturers can update own announcements"
  ON announcements FOR UPDATE
  USING (auth.uid() = lecturer_id);

-- Only the author can delete announcements
CREATE POLICY "Lecturers can delete own announcements"
  ON announcements FOR DELETE
  USING (auth.uid() = lecturer_id);


-- ============================================================
-- 8. MATERIAL_EMBEDDINGS TABLE
-- ============================================================
-- Contains: id, course_id, material_id, content, embedding
ALTER TABLE material_embeddings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read embeddings (needed for AI search/chat)
CREATE POLICY "Authenticated users can view embeddings"
  ON material_embeddings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only lecturers (via course ownership) can insert embeddings
CREATE POLICY "Course lecturers can insert embeddings"
  ON material_embeddings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = material_embeddings.course_id
      AND courses.lecturer_id = auth.uid()
    )
  );

-- Only course lecturers can delete embeddings
CREATE POLICY "Course lecturers can delete embeddings"
  ON material_embeddings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = material_embeddings.course_id
      AND courses.lecturer_id = auth.uid()
    )
  );


-- ============================================================
-- 9. CHAT_SESSIONS TABLE
-- ============================================================
-- Contains: id, user_id (or similar), course_id, created_at, etc.
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own chat sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own chat sessions
CREATE POLICY "Users can create own chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 10. CHAT_MESSAGES TABLE
-- ============================================================
-- Contains: id, session_id, role, content, created_at, etc.
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see messages from their own sessions
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Users can insert messages into their own sessions
CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );


-- ============================================================
-- DONE! All tables now have RLS enabled with proper policies.
-- ============================================================
-- After running this, go to Supabase Dashboard → Authentication → Policies
-- to verify all policies are in place. The security warnings should clear
-- within a few minutes.
--
-- NOTE: If the chat_sessions/chat_messages policies fail because the column
-- name isn't 'user_id', check the actual column name in your table and
-- update those policies accordingly.
-- ============================================================
