import { redirect } from 'next/navigation'
import { CalendarDays, Clock, MapPin } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Exam = {
  id: string
  title: string
  level: string
  exam_date: string
  duration_minutes?: number | null
  venue: string
  notes?: string | null
  courses?: {
    id?: string | null
    code?: string | null
    title?: string | null
  } | null
}

export default async function ExamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, academic_level')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/dashboard/admin/exams')

  let courseIds: string[] = []
  if (profile?.role === 'lecturer') {
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('lecturer_id', user.id)

    courseIds = courses?.map((course) => course.id) || []
  } else {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id)

    courseIds = enrollments?.map((enrollment) => enrollment.course_id) || []
  }

  let exams: Exam[] = []
  if (courseIds.length > 0) {
    let query = supabase
      .from('exams')
      .select('id, title, level, exam_date, duration_minutes, venue, notes, courses(id, code, title)')
      .in('course_id', courseIds)
      .order('exam_date', { ascending: true })

    if (profile?.role !== 'lecturer' && profile?.academic_level) {
      query = query.eq('level', profile.academic_level)
    }

    const { data } = await query
    exams = (data || []) as unknown as Exam[]
  }

  const now = new Date()
  const upcoming = exams.filter((exam) => new Date(exam.exam_date) >= now)
  const past = exams.filter((exam) => new Date(exam.exam_date) < now)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <CalendarDays className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
        </div>
        <p className="text-muted-foreground">
          {profile?.role === 'lecturer'
            ? 'University exam timetable for courses you teach.'
            : 'Your university exam timetable based on your level and enrolled courses.'}
        </p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">No exams scheduled yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Exams will appear here after the admin imports the official timetable.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <ExamList title="Upcoming Exams" exams={upcoming} emptyText="No upcoming exams." />
          {past.length > 0 && <ExamList title="Past Exams" exams={past} emptyText="No past exams." faded />}
        </div>
      )}
    </div>
  )
}

function ExamList({
  title,
  exams,
  emptyText,
  faded = false,
}: {
  title: string
  exams: Exam[]
  emptyText: string
  faded?: boolean
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">{emptyText}</CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {exams.map((exam) => {
            const date = new Date(exam.exam_date)

            return (
              <div key={exam.id} className={`p-4 ${faded ? 'opacity-60' : ''}`}>
                <div className="grid gap-3 md:grid-cols-12 md:items-center">
                  <div className="md:col-span-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">{exam.courses?.code || 'Course'}</Badge>
                      <Badge variant="secondary">{exam.level} Level</Badge>
                    </div>
                    <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                    {exam.notes && <p className="text-xs text-muted-foreground mt-1">{exam.notes}</p>}
                  </div>

                  <div className="md:col-span-3 text-sm text-gray-600">
                    <p className="font-medium">
                      {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {exam.duration_minutes || 120} mins
                    </p>
                  </div>

                  <div className="md:col-span-4 flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{exam.venue}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
