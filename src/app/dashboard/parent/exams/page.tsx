import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Clock, MapPin, Users, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function initials(name?: string | null) {
  return (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

type LinkedStudent = {
  id: string
  full_name: string | null
  academic_level: string | null
}

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

export default async function ParentExamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') redirect('/dashboard')

  // Fetch linked students
  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_id', user.id)
    .eq('status', 'approved')

  const studentIds = links?.map(l => l.student_id) || []

  if (studentIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <CalendarDays className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Exam Schedule</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">View your children&apos;s upcoming and past exams.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">No Linked Students</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Link your child&apos;s account from the dashboard to view their exam schedule.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/parent">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use admin client to bypass RLS
  let queryClient: any = supabase
  try {
    queryClient = createAdminClient()
  } catch {
    // Fall back to regular client
  }

  const { data: students } = await queryClient
    .from('profiles')
    .select('id, full_name, academic_level')
    .in('id', studentIds)

  const linkedStudents = (students || []) as LinkedStudent[]

  // Fetch exams per student
  type StudentExams = {
    student: LinkedStudent
    upcoming: Exam[]
    past: Exam[]
  }

  const now = new Date()
  const studentExams: StudentExams[] = []

  for (const student of linkedStudents) {
    const { data: enrollments } = await queryClient
      .from('enrollments')
      .select('course_id')
      .eq('student_id', student.id)

    const courseIds = enrollments?.map((e: any) => e.course_id) || []

    let exams: Exam[] = []
    if (courseIds.length > 0) {
      let query = queryClient
        .from('exams')
        .select('id, title, level, exam_date, duration_minutes, venue, notes, courses(id, code, title)')
        .in('course_id', courseIds)
        .order('exam_date', { ascending: true })

      if (student.academic_level) {
        query = query.eq('level', student.academic_level)
      }

      const { data } = await query
      exams = (data || []) as unknown as Exam[]
    }

    const upcoming = exams.filter((exam) => new Date(exam.exam_date) >= now)
    const past = exams.filter((exam) => new Date(exam.exam_date) < now)

    studentExams.push({ student, upcoming, past })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Exam Schedule</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">View your children&apos;s upcoming and past exams.</p>
      </div>

      {/* PER-STUDENT EXAMS */}
      {studentExams.map(({ student, upcoming, past }) => (
        <div key={student.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Student header */}
          <div className="bg-slate-50/50 border-b border-slate-100/80 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-bold text-indigo-600 text-sm shadow-sm">
                {initials(student.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800 truncate">{student.full_name}</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                  {student.academic_level ? `${student.academic_level} Level` : 'Student'}
                  {' \u2022 '}{upcoming.length} upcoming, {past.length} past
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {upcoming.length === 0 && past.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No exams scheduled for this student.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Upcoming Exams</h4>
                    <div className="space-y-2">
                      {upcoming.map((exam) => {
                        const date = new Date(exam.exam_date)
                        return (
                          <div key={exam.id} className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100/60 hover:bg-slate-50 transition-all duration-200">
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 text-center min-w-[44px] pt-0.5">
                                <p className="text-lg font-extrabold text-slate-800 leading-none">{date.getDate()}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  {date.toLocaleDateString('en-US', { month: 'short' })}
                                </p>
                              </div>
                              <div className="w-px h-10 bg-slate-200 shrink-0 self-center" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-[9px] font-mono font-bold bg-white border border-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                                    {exam.courses?.code || 'Course'}
                                  </span>
                                  <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[9px] font-medium py-0 px-1.5 rounded-full">
                                    {exam.level} Level
                                  </Badge>
                                </div>
                                <p className="text-xs font-bold text-slate-700 truncate">{exam.title}</p>
                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3" />
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {'\u2022'} {exam.duration_minutes || 120} min
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                    <MapPin className="h-3 w-3" />
                                    {exam.venue}
                                  </span>
                                </div>
                                {exam.notes && (
                                  <p className="text-[10px] text-slate-400 mt-1.5 italic">{exam.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Past */}
                {past.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Past Exams</h4>
                    <div className="space-y-2">
                      {past.map((exam) => {
                        const date = new Date(exam.exam_date)
                        return (
                          <div key={exam.id} className="p-3.5 rounded-xl bg-slate-50/30 border border-slate-100/40 opacity-60">
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 text-center min-w-[44px] pt-0.5">
                                <p className="text-lg font-extrabold text-slate-600 leading-none">{date.getDate()}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">
                                  {date.toLocaleDateString('en-US', { month: 'short' })}
                                </p>
                              </div>
                              <div className="w-px h-10 bg-slate-200 shrink-0 self-center" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-mono font-bold bg-white border border-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                                    {exam.courses?.code || 'Course'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-600 truncate">{exam.title}</p>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {exam.venue}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
