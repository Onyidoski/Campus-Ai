-- ============================================================
-- CREATE CAMPUS_ANNOUNCEMENTS TABLE
-- ============================================================
-- This table stores campus-wide announcements posted by admins.
-- Unlike the course-specific `announcements` table, these are
-- visible to ALL users (or filtered by academic level).
--
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

CREATE TABLE IF NOT EXISTS campus_announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  target_level TEXT DEFAULT NULL,  -- NULL = campus-wide, '100'/'200'/'300'/'400' = level-specific
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campus_announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view campus announcements
CREATE POLICY "Authenticated users can view campus announcements"
  ON campus_announcements FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert campus announcements
-- (We check the profiles table to verify the user is an admin)
CREATE POLICY "Admins can create campus announcements"
  ON campus_announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete campus announcements
CREATE POLICY "Admins can delete campus announcements"
  ON campus_announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- ALSO: Allow admins to update ANY profile's role
-- (Add this policy to the existing profiles table)
-- ============================================================

-- Admins can update any user's profile (for role changes)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
    )
  );

-- Admins can delete any user's profile
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.role = 'admin'
    )
  );
