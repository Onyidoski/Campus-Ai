-- =============================================================
-- Parent-Student Links Table
-- Links parent accounts to student accounts so parents can
-- view their children's academic performance.
-- =============================================================

-- Create the parent_student_links table
CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

-- Enable RLS
ALTER TABLE parent_student_links ENABLE ROW LEVEL SECURITY;

-- Policy: Parents can view their own links
CREATE POLICY "Parents can view own links"
  ON parent_student_links
  FOR SELECT
  USING (auth.uid() = parent_id);

-- Policy: Students can view links where they are the student (to approve/reject)
CREATE POLICY "Students can view links targeting them"
  ON parent_student_links
  FOR SELECT
  USING (auth.uid() = student_id);

-- Policy: Parents can insert new link requests
CREATE POLICY "Parents can create link requests"
  ON parent_student_links
  FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Policy: Students can update link status (approve/reject)
CREATE POLICY "Students can update link status"
  ON parent_student_links
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Policy: Either party can delete the link
CREATE POLICY "Either party can delete links"
  ON parent_student_links
  FOR DELETE
  USING (auth.uid() = parent_id OR auth.uid() = student_id);

-- Policy: Admins can do everything
CREATE POLICY "Admins have full access to parent_student_links"
  ON parent_student_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_status ON parent_student_links(status);
