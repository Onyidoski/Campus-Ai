'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// --- CREATE COURSE ACTION (LECTURERS) ---
export async function createCourse(formData: FormData) {
  const supabase = await createClient()

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Extract Data
  const code = formData.get('code') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const level = formData.get('level') as string

  // 3. Insert into DB
  const { error } = await supabase.from('courses').insert({
    code,
    title,
    description,
    level,
    lecturer_id: user.id // Tie course to this lecturer
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/courses')
  return { success: 'Course created successfully!' }
}

// --- JOIN COURSE ACTION (STUDENTS - MANUAL CODE) ---
export async function joinCourse(formData: FormData) {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Extract Invite Code
  const inviteCode = formData.get('inviteCode') as string
  if (!inviteCode) return { error: 'Invite code is required' }

  // 3. Find the course by invite code
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .single()

  if (courseError || !course) {
    return { error: 'Invalid invite code. Please check and try again.' }
  }

  // 4. Check if student is already enrolled
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', course.id)
    .eq('student_id', user.id)
    .single()

  if (existing) {
    return { error: 'You are already enrolled in this course.' }
  }

  // 5. Enroll the student
  const { error: enrollError } = await supabase
    .from('enrollments')
    .insert({
      course_id: course.id,
      student_id: user.id
    })

  if (enrollError) return { error: 'Failed to join course.' }

  revalidatePath('/dashboard/courses')
  return { success: 'Successfully joined the course!' }
}

// --- BULK COURSE REGISTRATION ACTION (STUDENTS - CHECKLIST) ---
export async function bulkEnrollCourses(courseIds: string[]) {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!courseIds || courseIds.length === 0) {
    return { error: 'Please select at least one course to register.' }
  }

  // 2. Prepare the data for bulk insertion
  const enrollmentsToInsert = courseIds.map((id) => ({
    course_id: id,
    student_id: user.id
  }))

  // 3. Insert all at once
  const { error } = await supabase
    .from('enrollments')
    .insert(enrollmentsToInsert)

  if (error) {
    // 23505 is the Postgres error code for unique constraint violation (already enrolled)
    if (error.code === '23505') {
      return { error: 'You are already registered for one or more of these courses.' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/courses')
  return { success: 'Successfully registered for courses!' }
}