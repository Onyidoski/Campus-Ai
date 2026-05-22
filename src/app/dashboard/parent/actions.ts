'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function linkStudent(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify the user is a parent
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') return { error: 'Only parents can link students' }

  const studentEmail = formData.get('studentEmail') as string
  if (!studentEmail) return { error: 'Student email is required' }

  // Find the student by email
  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('email', studentEmail)
    .single()

  if (!studentProfile) return { error: 'No account found with this email address' }
  if (studentProfile.role !== 'student') return { error: 'This account is not a student account' }

  // Check for existing link
  const { data: existingLink } = await supabase
    .from('parent_student_links')
    .select('id, status')
    .eq('parent_id', user.id)
    .eq('student_id', studentProfile.id)
    .single()

  if (existingLink) {
    if (existingLink.status === 'approved') return { error: 'You are already linked to this student' }
    if (existingLink.status === 'pending') return { error: 'A link request to this student is already pending' }
    // If rejected, allow re-requesting by updating
    const { error: updateError } = await supabase
      .from('parent_student_links')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', existingLink.id)

    if (updateError) return { error: updateError.message }
    
    revalidatePath('/dashboard/parent')
    return { success: true, message: `Re-sent link request to ${studentProfile.full_name}` }
  }

  // Create the link with auto-approved status (for simplicity in a campus system)
  const { error } = await supabase
    .from('parent_student_links')
    .insert({
      parent_id: user.id,
      student_id: studentProfile.id,
      status: 'approved', // Auto-approve for campus context
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/parent')
  return { success: true, message: `Successfully linked to ${studentProfile.full_name}` }
}

export async function unlinkStudent(studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('parent_student_links')
    .delete()
    .eq('parent_id', user.id)
    .eq('student_id', studentId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/parent')
  return { success: true }
}
