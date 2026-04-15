import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AIChatClient } from './ai-chat-client'

export default async function AIChatPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the student's enrolled courses with their materials
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('courses(id, code, title)')
    .eq('student_id', user.id)

  const courses = enrollments
    ?.map((e: any) => e.courses)
    .filter(Boolean) || []

  // Also fetch the user's profile for the welcome message
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <AIChatClient
      courses={courses}
      userName={profile?.full_name || 'Student'}
    />
  )
}
