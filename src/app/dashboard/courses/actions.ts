'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

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