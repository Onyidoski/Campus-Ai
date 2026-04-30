import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Video, ChevronLeft, ChevronRight, LayoutGrid, List, Sun } from 'lucide-react'

// Helper to get the Monday of a given week
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const COURSE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-orange-50', border: 'border-l-orange-500', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  { bg: 'bg-pink-50', border: 'border-l-pink-500', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' },
  { bg: 'bg-teal-50', border: 'border-l-teal-500', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
  { bg: 'bg-amber-50', border: 'border-l-amber-500', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-indigo-50', border: 'border-l-indigo-500', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
]

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  scheduled: { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
  live: { dot: 'bg-green-500 animate-pulse', badge: 'bg-green-100 text-green-700' },
  ended: { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500' },
}

type ViewMode = 'week' | 'day' | 'list'

export default async function TimetablePage({
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

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const weekOffset = parseInt((resolvedSearchParams.week as string) || '0') || 0
  const viewMode: ViewMode = (['week', 'day', 'list'].includes(resolvedSearchParams.view as string)
    ? resolvedSearchParams.view as ViewMode
    : 'week')

  const today = new Date()
  const baseDate = addDays(today, weekOffset * 7)
  const weekStart = getWeekStart(baseDate)
  const weekEnd = addDays(weekStart, 7)

  // Fetch user's course IDs
  let courseIds: string[] = []
  if (profile?.role === 'lecturer') {
    const { data: courses } = await supabase.from('courses').select('id').eq('lecturer_id', user.id)
    courseIds = courses?.map(c => c.id) || []
  } else {
    const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', user.id)
    courseIds = enrollments?.map(e => e.course_id) || []
  }

  let weekClasses: any[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('online_classes')
      .select('*, courses(id, code, title)')
      .in('course_id', courseIds)
      .gte('scheduled_at', weekStart.toISOString())
      .lt('scheduled_at', weekEnd.toISOString())
      .order('scheduled_at', { ascending: true })
    weekClasses = data || []
  }

  // Group by day
  const classesByDay: Record<number, any[]> = {}
  DAYS.forEach((_, i) => { classesByDay[i] = [] })
  weekClasses.forEach((cls: any) => {
    const d = new Date(cls.scheduled_at)
    let dayIndex = d.getDay() - 1
    if (dayIndex < 0) dayIndex = 6
    classesByDay[dayIndex].push(cls)
  })

  const currentWeekStart = getWeekStart(today)
  const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime()
  const todayDayIndex = today.getDay() - 1 < 0 ? 6 : today.getDay() - 1

  const weekEndDate = addDays(weekStart, 6)
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  const totalClassesThisWeek = weekClasses.length

  // Assign colors
  const courseColorMap: Record<string, typeof COURSE_COLORS[0]> = {}
  const uniqueCourseIds = [...new Set(weekClasses.map((c: any) => c.course_id))]
  uniqueCourseIds.forEach((id, i) => {
    courseColorMap[id] = COURSE_COLORS[i % COURSE_COLORS.length]
  })

  // Build URL helper for view switch (preserving week offset)
  const viewUrl = (v: ViewMode) =>
    `/dashboard/timetable?view=${v}${weekOffset !== 0 ? `&week=${weekOffset}` : ''}`
  const navUrl = (offset: number) =>
    `/dashboard/timetable?view=${viewMode}&week=${offset}`

  // Day view: today's classes
  const todayDateObj = isCurrentWeek ? addDays(weekStart, todayDayIndex) : weekStart
  const todayClasses = classesByDay[todayDayIndex] || []

  // View toggle buttons config
  const views: { key: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'week', label: 'Week', icon: LayoutGrid },
    { key: 'day', label: 'Day', icon: Sun },
    { key: 'list', label: 'List', icon: List },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          </div>
          <p className="text-muted-foreground">
            {viewMode === 'day' ? "Today's scheduled classes." : 'Your scheduled classes for the week.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* VIEW TOGGLE */}
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50/80 p-0.5">
            {views.map((v) => (
              <Link key={v.key} href={viewUrl(v.key)}>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer
                  ${viewMode === v.key
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <v.icon className="h-3.5 w-3.5" />
                  {v.label}
                </div>
              </Link>
            ))}
          </div>

          {/* WEEK NAVIGATION */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href={navUrl(weekOffset - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>

            <div className="text-center min-w-[180px]">
              <p className="text-sm font-semibold text-gray-900">{weekLabel}</p>
              <p className="text-[10px] text-muted-foreground">
                {isCurrentWeek ? 'This Week' : weekOffset > 0 ? `${weekOffset} week${weekOffset > 1 ? 's' : ''} ahead` : `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? 's' : ''} ago`}
                {' • '}{totalClassesThisWeek} class{totalClassesThisWeek !== 1 ? 'es' : ''}
              </p>
            </div>

            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <Link href={navUrl(weekOffset + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            {!isCurrentWeek && (
              <Button variant="ghost" size="sm" className="text-xs h-7 ml-1" asChild>
                <Link href={`/dashboard/timetable?view=${viewMode}`}>Today</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* NO COURSES MESSAGE */}
      {courseIds.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-gray-200 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Courses Yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {profile?.role === 'lecturer'
                ? "You haven't created any courses. Create a course first to schedule classes."
                : "You're not enrolled in any courses. Enroll in courses to see your timetable."}
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/courses">Go to Courses</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* =================== WEEK VIEW =================== */}
      {courseIds.length > 0 && viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {DAYS.map((day, dayIndex) => {
            const dayDate = addDays(weekStart, dayIndex)
            const isToday = isCurrentWeek && dayIndex === todayDayIndex
            const isPast = dayDate < today && !isToday
            const dayClasses = classesByDay[dayIndex]

            return (
              <div key={day} className="flex flex-col">
                <div className={`rounded-t-xl px-3 py-2.5 text-center border-b-2 transition-colors ${
                  isToday
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${
                    isToday ? 'text-indigo-100' : 'text-gray-400'
                  }`}>
                    {SHORT_DAYS[dayIndex]}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-800'}`}>
                    {dayDate.getDate()}
                  </p>
                </div>

                <div className={`flex-1 rounded-b-xl border border-t-0 min-h-[120px] p-2 space-y-2 ${
                  isToday ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-200 bg-white'
                }`}>
                  {dayClasses.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[80px]">
                      <p className={`text-[11px] ${isPast ? 'text-gray-300' : 'text-gray-400'}`}>No classes</p>
                    </div>
                  ) : (
                    dayClasses.map((cls: any) => {
                      const startTime = new Date(cls.scheduled_at)
                      const endTime = new Date(startTime.getTime() + cls.duration_minutes * 60000)
                      const colors = courseColorMap[cls.course_id] || COURSE_COLORS[0]
                      const status = STATUS_STYLES[cls.status] || STATUS_STYLES.scheduled

                      return (
                        <Link key={cls.id} href={`/dashboard/online-class/${cls.id}`}
                          className={`block rounded-lg p-2.5 border-l-[3px] transition-all duration-200
                            hover:shadow-md hover:-translate-y-0.5 cursor-pointer
                            ${colors.bg} ${colors.border}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold ${colors.text}`}>{cls.courses?.code}</span>
                            <span className="flex items-center gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              <span className={`text-[9px] font-medium ${status.badge} px-1 py-0 rounded`}>{cls.status}</span>
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mb-1.5">{cls.title}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Clock className="h-2.5 w-2.5" />
                            {formatTime(startTime)} – {formatTime(endTime)}
                          </div>
                          <p className="text-[9px] text-gray-400 mt-0.5">{cls.duration_minutes} min</p>
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* =================== DAY VIEW =================== */}
      {courseIds.length > 0 && viewMode === 'day' && (
        <div className="max-w-2xl mx-auto">
          {/* Day header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 bg-indigo-50 rounded-2xl px-6 py-3">
              <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-lg font-bold">{today.getDate()}</span>
              </div>
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {today.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className="text-xs text-gray-500">
                  {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {' • '}{todayClasses.length} class{todayClasses.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </div>

          {todayClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Sun className="h-10 w-10 text-amber-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Classes Today</h3>
                <p className="text-sm text-gray-500 mt-1">Enjoy your free time! Check the week view for upcoming classes.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayClasses.map((cls: any) => {
                const startTime = new Date(cls.scheduled_at)
                const endTime = new Date(startTime.getTime() + cls.duration_minutes * 60000)
                const colors = courseColorMap[cls.course_id] || COURSE_COLORS[0]
                const status = STATUS_STYLES[cls.status] || STATUS_STYLES.scheduled

                const now = new Date()
                const isNow = now >= startTime && now <= endTime
                const isPast = now > endTime

                return (
                  <Link key={cls.id} href={`/dashboard/online-class/${cls.id}`}
                    className={`block rounded-xl border-l-4 transition-all duration-200
                      hover:shadow-lg hover:-translate-y-0.5
                      ${colors.border} ${isNow ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
                  >
                    <Card className={`overflow-hidden ${isPast ? 'opacity-60' : ''}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Time column */}
                          <div className="shrink-0 text-center min-w-[64px]">
                            <p className="text-lg font-bold text-gray-900">{formatTime(startTime)}</p>
                            <p className="text-[10px] text-gray-400">to {formatTime(endTime)}</p>
                            <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              <span className="capitalize">{cls.status}</span>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="w-px bg-gray-200 self-stretch shrink-0" />

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                {cls.courses?.code}
                              </Badge>
                              {isNow && (
                                <Badge className="bg-green-600 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                  NOW
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-1">{cls.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {cls.duration_minutes} min
                              </span>
                              <span className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                Online
                              </span>
                            </div>
                          </div>

                          {/* Join button for live */}
                          {cls.status === 'live' && (
                            <div className="shrink-0">
                              <div className="bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-lg">
                                Join Now →
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* =================== LIST VIEW =================== */}
      {courseIds.length > 0 && viewMode === 'list' && (
        <div className="max-w-3xl">
          {weekClasses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <List className="h-10 w-10 text-gray-200 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No Classes This Week</h3>
                <p className="text-sm text-gray-500 mt-1">No scheduled classes. Navigate to another week to check.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day, dayIndex) => {
                const dayClasses = classesByDay[dayIndex]
                if (dayClasses.length === 0) return null

                const dayDate = addDays(weekStart, dayIndex)
                const isToday = isCurrentWeek && dayIndex === todayDayIndex

                return (
                  <div key={day}>
                    {/* Day label */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isToday ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <span className="text-sm font-bold">{dayDate.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {day}
                          {isToday && <span className="ml-2 text-indigo-600 text-xs font-medium">(Today)</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {dayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          {' • '}{dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Classes */}
                    <Card className="overflow-hidden">
                      <div className="divide-y divide-gray-100">
                        {dayClasses.map((cls: any) => {
                          const startTime = new Date(cls.scheduled_at)
                          const endTime = new Date(startTime.getTime() + cls.duration_minutes * 60000)
                          const colors = courseColorMap[cls.course_id] || COURSE_COLORS[0]
                          const status = STATUS_STYLES[cls.status] || STATUS_STYLES.scheduled

                          return (
                            <Link key={cls.id} href={`/dashboard/online-class/${cls.id}`}
                              className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
                            >
                              {/* Time */}
                              <div className="shrink-0 text-right min-w-[60px]">
                                <p className="text-sm font-bold text-gray-900">{formatTime(startTime)}</p>
                                <p className="text-[10px] text-gray-400">{formatTime(endTime)}</p>
                              </div>

                              {/* Color bar */}
                              <div className={`w-1 self-stretch rounded-full ${colors.border.replace('border-l-', 'bg-')}`} />

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">{cls.courses?.code}</Badge>
                                  <span className="flex items-center gap-1">
                                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                    <span className="text-[10px] text-gray-500 capitalize">{cls.status}</span>
                                  </span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 truncate">{cls.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{cls.duration_minutes} min • Online</p>
                              </div>

                              {cls.status === 'live' && (
                                <Badge className="bg-green-600 text-white text-[10px] shrink-0 animate-pulse">
                                  LIVE
                                </Badge>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
