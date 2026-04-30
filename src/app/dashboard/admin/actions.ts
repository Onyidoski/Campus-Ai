'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createNotifications } from '@/lib/notifications'

// --- HELPER: Verify admin role ---
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Admin access required', supabase: null, user: null }

  return { error: null, supabase, user }
}

// --- UPDATE USER ROLE ---
export async function updateUserRole(userId: string, newRole: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const validRoles = ['student', 'lecturer', 'admin', 'parent']
  if (!validRoles.includes(newRole)) {
    return { error: 'Invalid role.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
  return { success: `User role updated to ${newRole}.` }
}

// --- DELETE USER (remove profile — does NOT delete auth user, just profile) ---
export async function deleteUserProfile(userId: string) {
  const { error: authError, supabase, user } = await requireAdmin()
  if (authError || !supabase || !user) return { error: authError }

  // Prevent admin from deleting themselves
  if (userId === user.id) {
    return { error: 'You cannot delete your own account.' }
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/users')
  return { success: 'User profile removed.' }
}

// --- CREATE CAMPUS-WIDE ANNOUNCEMENT ---
export async function createCampusAnnouncement(formData: FormData) {
  const { error: authError, supabase, user } = await requireAdmin()
  if (authError || !supabase || !user) return { error: authError }

  const content = formData.get('content') as string
  const isUrgent = formData.get('isUrgent') === 'on'
  const targetLevel = formData.get('targetLevel') as string | null

  if (!content?.trim()) return { error: 'Announcement cannot be empty.' }

  const { data: announcement, error } = await supabase
    .from('campus_announcements')
    .insert({
      admin_id: user.id,
      content,
      is_urgent: isUrgent,
      target_level: targetLevel && targetLevel !== 'all' ? targetLevel : null,
    })
    .select('id, target_level')
    .single()

  if (error) return { error: error.message }

  if (isUrgent) {
    let profileQuery = supabase
      .from('profiles')
      .select('id')

    if (announcement?.target_level) {
      profileQuery = profileQuery.eq('academic_level', announcement.target_level)
    }

    const { data: targetUsers } = await profileQuery

    await createNotifications(
      supabase,
      (targetUsers || []).map((targetUser) => ({
        user_id: targetUser.id,
        type: 'campus_announcement',
        title: 'Urgent campus announcement',
        message: content,
        href: '/dashboard',
      }))
    )
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard')
  return { success: 'Campus announcement posted!' }
}

// --- DELETE CAMPUS ANNOUNCEMENT ---
export async function deleteCampusAnnouncement(announcementId: string, formData?: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('campus_announcements')
    .delete()
    .eq('id', announcementId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/admin')
}

// --- ASSIGN LECTURER TO COURSE ---
export async function assignLecturerToCourse(courseId: string, lecturerId: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from('courses')
    .update({ lecturer_id: lecturerId })
    .eq('id', courseId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/courses')
  revalidatePath('/dashboard/admin')
  return { success: 'Lecturer assigned successfully!' }
}

// --- ADMIN CREATE COURSE ---
export async function adminCreateCourse(formData: FormData) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const code = formData.get('code') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const level = formData.get('level') as string
  const lecturerId = formData.get('lecturerId') as string | null

  if (!code || !title || !level) return { error: 'Course code, title, and level are required.' }

  const { error } = await supabase
    .from('courses')
    .insert({
      code,
      title,
      description: description || null,
      level,
      lecturer_id: lecturerId && lecturerId !== 'unassigned' ? lecturerId : null,
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/courses')
  return { success: 'Course created successfully!' }
}

// --- ADMIN DELETE COURSE ---
export async function adminDeleteCourse(courseId: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/courses')
  return { success: 'Course deleted.' }
}
