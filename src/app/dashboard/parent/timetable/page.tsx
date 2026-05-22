import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Video, ChevronLeft, ChevronRight, Users, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function initials(name?: string | null) {
  return (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type LinkedStudent = {
  id: string
  full_name: string | null
  academic_level: string | null
}

export default async function ParentTimetablePage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') redirect('/dashboard')

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const weekOffset = parseInt((resolvedSearchParams.week as string) || '0') || 0

  const today = new Date()
  const baseDate = addDays(today, weekOffset * 7)
  const weekStart = getWeekStart(baseDate)
  const weekEnd = addDays(weekStart, 7)

  const currentWeekStart = getWeekStart(today)
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime()
  const todayDayIndex = today.getDay() - 1 < 0 ? 6 : today.getDay() - 1

  const weekEndDate = addDays(weekStart, 6)
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2013 ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

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
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Timetable</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">View your children&apos;s weekly class schedule.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800">No Linked Students</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Link your child&apos;s account from the dashboard to view their timetable.
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

  // Build per-student timetable data
  type StudentSchedule = {
    student: LinkedStudent
    classesByDay: Record<number, any[]>
    totalClasses: number
  }

  const schedules: StudentSchedule[] = []

  for (const student of linkedStudents) {
    const { data: enrollments } = await queryClient
      .from('enrollments')
      .select('course_id')
      .eq('student_id', student.id)

    const courseIds = enrollments?.map((e: any) => e.course_id) || []

    let weekClasses: any[] = []
    if (courseIds.length > 0) {
      const { data } = await queryClient
        .from('online_classes')
        .select('*, courses(id, code, title)')
        .in('course_id', courseIds)
        .gte('scheduled_at', weekStart.toISOString())
        .lt('scheduled_at', weekEnd.toISOString())
        .order('scheduled_at', { ascending: true })
      weekClasses = data || []
    }

    const classesByDay: Record<number, any[]> = {}
    DAYS.forEach((_, i) => { classesByDay[i] = [] })
    weekClasses.forEach((cls: any) => {
      const d = new Date(cls.scheduled_at)
      let dayIndex = d.getDay() - 1
      if (dayIndex < 0) dayIndex = 6
      classesByDay[dayIndex].push(cls)
    })

    schedules.push({
      student,
      classesByDay,
      totalClasses: weekClasses.length,
    })
  }

  const navUrl = (offset: number) =>
    `/dashboard/parent/timetable?week=${offset}`

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Timetable</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">View your children&apos;s weekly class schedule.</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href={navUrl(weekOffset - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="text-center min-w-[180px]">
            <p className="text-sm font-semibold text-slate-800">{weekLabel}</p>
            <p className="text-[10px] text-slate-400">
              {isCurrentWeek ? 'This Week' : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
            </p>
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8" asChild>
            <Link href={navUrl(weekOffset + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" className="text-xs h-7 ml-1" asChild>
              <Link href="/dashboard/parent/timetable">Today</Link>
            </Button>
          )}
        </div>
      </div>

      {/* PER-STUDENT SCHEDULES */}
      {schedules.map(({ student, classesByDay, totalClasses }) => (
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
                  {' \u2022 '}{totalClasses} class{totalClasses !== 1 ? 'es' : ''} this week
                </p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="p-4 sm:p-5">
            {totalClasses === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No scheduled classes this week.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS.map((day, dayIndex) => {
                  const dayClasses = classesByDay[dayIndex]
                  if (dayClasses.length === 0) return null

                  const dayDate = addDays(weekStart, dayIndex)
                  const isToday = isCurrentWeek && dayIndex === todayDayIndex

                  return (
                    <div key={day}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isToday ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {dayDate.getDate()}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700">
                            {SHORT_DAYS[dayIndex]}
                            {isToday && <span className="ml-1.5 text-indigo-600 font-medium">(Today)</span>}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 ml-9">
                        {dayClasses.map((cls: any) => {
                          const startTime = new Date(cls.scheduled_at)
                          const endTime = new Date(startTime.getTime() + cls.duration_minutes * 60000)

                          return (
                            <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/60 hover:bg-slate-50 transition-all duration-200">
                              <div className="shrink-0 text-right min-w-[52px]">
                                <p className="text-xs font-bold text-slate-700">{formatTime(startTime)}</p>
                                <p className="text-[9px] text-slate-400">{formatTime(endTime)}</p>
                              </div>
                              <div className="w-px h-8 bg-slate-200 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[9px] font-mono font-bold bg-white border border-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                                    {cls.courses?.code}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {cls.duration_minutes} min
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-700 truncate">{cls.title || cls.courses?.title}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
