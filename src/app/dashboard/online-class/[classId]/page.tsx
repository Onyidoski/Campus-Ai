import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, Users, Calendar } from 'lucide-react'
import { JitsiRoom } from './jitsi-room'

export default async function OnlineClassPage({
  params,
}: {
  params: Promise<{ classId: string }> | { classId: string }
}) {
  const supabase = await createClient()

  const resolvedParams = await params
  const classId = resolvedParams.classId

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch the class details
  const { data: onlineClass, error } = await supabase
    .from('online_classes')
    .select('*, courses(id, code, title, lecturer_id), profiles:created_by(full_name)')
    .eq('id', classId)
    .single()

  if (error || !onlineClass) notFound()

  // 3. Check authorization: user must be the lecturer or an enrolled student
  const isLecturer = onlineClass.courses?.lecturer_id === user.id

  if (!isLecturer) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', onlineClass.course_id)
      .single()

    if (!enrollment) redirect('/dashboard')
  }

  // 4. Get user's display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || 'Student'
  const scheduledDate = new Date(onlineClass.scheduled_at)

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    live: 'bg-green-100 text-green-700 border-green-200',
    ended: 'bg-gray-100 text-gray-500 border-gray-200',
  }
  const statusColor = statusColors[onlineClass.status] || 'bg-gray-100 text-gray-500'

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href={`/dashboard/courses/${onlineClass.course_id}?tab=classes`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-900 truncate">{onlineClass.title}</h1>
              <Badge className={`text-[10px] uppercase tracking-wider border ${statusColor}`}>
                {onlineClass.status === 'live' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                )}
                {onlineClass.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
              <span className="font-medium text-gray-500">{onlineClass.courses?.code}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <Users className="h-3 w-3" />
                {onlineClass.profiles?.full_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Jitsi Meeting Area */}
      <div className="flex-1 bg-gray-900">
        {onlineClass.status === 'ended' ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-white px-4">
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">This class has ended</h2>
            <p className="text-gray-400 text-sm max-w-sm">
              The session is no longer available. Check your course page for recordings or notes.
            </p>
            <Button variant="secondary" className="mt-6" asChild>
              <Link href={`/dashboard/courses/${onlineClass.course_id}`}>
                Back to Course
              </Link>
            </Button>
          </div>
        ) : (
          <JitsiRoom
            roomName={onlineClass.room_name}
            displayName={displayName}
            classId={onlineClass.id}
            courseId={onlineClass.course_id}
            isLecturer={isLecturer}
          />
        )}
      </div>
    </div>
  )
}
