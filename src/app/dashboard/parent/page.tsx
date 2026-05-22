import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, ChevronRight, GraduationCap, User,
  Award, FileText, Clock, CheckCircle2, Megaphone,
  Info, AlertTriangle, Users, TrendingUp, CalendarDays
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LinkStudentDialog } from '@/components/dashboard/link-student-dialog'
import { UnlinkStudentButton } from '@/components/dashboard/unlink-student-button'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString))
}

function initials(name?: string | null) {
  return (name || 'U').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

// Types
type LinkedStudent = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  academic_level: string | null
  department: string | null
}

type StudentAcademicData = {
  student: LinkedStudent
  coursesCount: number
  courses: { id: string; code: string; title: string }[]
  assignments: { id: string; title: string; due_date: string; course_id: string; courses: { code: string; title: string } | null }[]
  submissions: { id: string; assignment_id: string; grade: string | null; feedback: string | null; submitted_at: string | null }[]
  stats: { graded: number; submitted: number; missing: number }
}

type CampusAnnouncement = {
  id: string
  content: string
  is_urgent?: boolean | null
  target_level?: string | null
  created_at: string
  profiles?: { full_name?: string | null } | null
}

export default async function ParentDashboardPage() {
  const supabase = await createClient()

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'parent') redirect('/dashboard')

  const userName = profile?.full_name || 'Parent'

  // Fetch linked students
  let linkedStudents: LinkedStudent[] = []
  let studentAcademicData: StudentAcademicData[] = []

  try {
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id')
      .eq('parent_id', user.id)
      .eq('status', 'approved')

    const studentIds = links?.map(l => l.student_id) || []

    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, academic_level, department')
        .in('id', studentIds)

      linkedStudents = (students || []) as LinkedStudent[]

      // Use admin client to bypass RLS for reading student academic data.
      // Authorization is already verified above via parent_student_links.
      let adminClient: ReturnType<typeof createAdminClient> | null = null
      try {
        adminClient = createAdminClient()
      } catch {
        // Service role key not configured — fall back to regular client
        // (will work if RLS policies for parents have been applied)
        console.warn('[Parent Dashboard] Service role key not configured, falling back to regular client. Some data may not be visible due to RLS.')
      }
      const queryClient = adminClient || supabase

      // Fetch academic data for each student
      for (const student of linkedStudents) {
        // Enrollments & courses
        const { data: enrollments, error: enrollErr } = await queryClient
          .from('enrollments')
          .select('course_id')
          .eq('student_id', student.id)

        if (enrollErr) console.error('[Parent Dashboard] Enrollments error:', enrollErr.message)

        const courseIds = enrollments?.map(e => e.course_id) || []
        let courses: any[] = []
        let assignments: any[] = []

        if (courseIds.length > 0) {
          const { data: coursesData, error: courseErr } = await queryClient
            .from('courses')
            .select('id, code, title')
            .in('id', courseIds)
          if (courseErr) console.error('[Parent Dashboard] Courses error:', courseErr.message)
          courses = coursesData || []

          const { data: assignmentsData, error: assignErr } = await queryClient
            .from('assignments')
            .select('id, title, due_date, course_id, courses(code, title)')
            .in('course_id', courseIds)
            .order('due_date', { ascending: false })
            .limit(10)
          if (assignErr) console.error('[Parent Dashboard] Assignments error:', assignErr.message)
          assignments = assignmentsData || []
        }

        // Submissions
        const { data: submissionsData, error: subErr } = await queryClient
          .from('submissions')
          .select('id, assignment_id, grade, feedback, submitted_at')
          .eq('student_id', student.id)

        if (subErr) console.error('[Parent Dashboard] Submissions error:', subErr.message)

        const submissions = submissionsData || []
        const assignmentIds = assignments.map((a: any) => a.id)
        const graded = submissions.filter(s => s.grade && assignmentIds.includes(s.assignment_id)).length
        const submitted = submissions.filter(s => !s.grade && assignmentIds.includes(s.assignment_id)).length
        const missing = assignments.length - graded - submitted

        studentAcademicData.push({
          student,
          coursesCount: courses.length,
          courses: courses as any,
          assignments: assignments as any,
          submissions: submissions as any,
          stats: { graded, submitted, missing: Math.max(0, missing) },
        })
      }
    }
  } catch (err) {
    console.error('[Parent Dashboard] Failed to fetch student data:', err)
    linkedStudents = []
    studentAcademicData = []
  }

  // Campus announcements
  let campusAnnouncements: CampusAnnouncement[] = []
  try {
    const { data } = await supabase
      .from('campus_announcements')
      .select('*, profiles:admin_id(full_name)')
      .order('created_at', { ascending: false })
      .is('target_level', null)
      .limit(5)
    campusAnnouncements = (data || []) as CampusAnnouncement[]
  } catch {
    campusAnnouncements = []
  }

  return (
    <div className="w-full mx-auto max-w-7xl pb-12 px-4 sm:px-6">

      {/* HEADER */}
      <header className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <Users className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Parent Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Real-time academic monitoring and campus announcements.</p>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-1.5 pr-4 shadow-sm">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs">
              {initials(userName)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-800 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Parent Account</p>
            </div>
          </div>
        </div>
      </header>

      {/* WELCOME + STATS ROW */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">

        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden text-white border border-slate-850">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-indigo-350 text-xs font-semibold tracking-wider uppercase">Overview</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight truncate">Welcome back, {userName}</h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md leading-relaxed font-light">
                Monitor your linked children&apos;s recent grades, outstanding tasks, and course registrations in a clean, unified view.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-6 sm:mt-8 pt-4 border-t border-white/5">
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 flex flex-col">
                <span className="text-2xl font-bold text-white">{linkedStudents.length}</span>
                <span className="text-[10px] text-slate-450 font-semibold tracking-wide uppercase mt-0.5">Linked Children</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 flex flex-col">
                <span className="text-2xl font-bold text-white">{studentAcademicData.reduce((sum, d) => sum + d.coursesCount, 0)}</span>
                <span className="text-[10px] text-slate-450 font-semibold tracking-wide uppercase mt-0.5">Active Courses</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 flex flex-col">
                <span className="text-2xl font-bold text-white">{studentAcademicData.reduce((sum, d) => sum + d.stats.graded, 0)}</span>
                <span className="text-[10px] text-slate-450 font-semibold tracking-wide uppercase mt-0.5">Graded Items</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none">
            <GraduationCap className="h-56 w-56 transform -rotate-12" strokeWidth={0.6} />
          </div>
        </div>

        {/* Link Students Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Linked Accounts</h3>
            </div>

            {linkedStudents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No students linked</p>
                <p className="text-xs text-slate-400 mt-1">Associate your child&apos;s email address to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedStudents.map(student => (
                  <div key={student.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 transition-all duration-200">
                    <div className="shrink-0 h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-bold text-indigo-600 text-xs">
                      {initials(student.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{student.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        {student.academic_level ? `${student.academic_level} Level` : 'Student'}
                        {student.department ? ` • ${student.department}` : ''}
                      </p>
                    </div>
                    <UnlinkStudentButton studentId={student.id} studentName={student.full_name || 'Student'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <LinkStudentDialog />
          </div>
        </div>
      </div>

      {/* STUDENT ACADEMIC DETAILS */}
      {studentAcademicData.length > 0 && (
        <div className="space-y-8 mb-8">
          {studentAcademicData.map(({ student, coursesCount, courses, assignments, submissions, stats }) => (
            <div key={student.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Student Header */}
              <div className="bg-slate-50/50 border-b border-slate-100/80 p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center font-bold text-indigo-600 text-base shadow-sm">
                    {initials(student.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-slate-800 truncate">{student.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        <User className="h-3 w-3" />
                        Academic Profile
                      </span>
                      {student.academic_level && (
                        <Badge className="bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100 text-[10px] font-medium py-0.5 px-2 rounded-full">
                          {student.academic_level} Level
                        </Badge>
                      )}
                      {student.department && (
                        <Badge variant="secondary" className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-medium py-0.5 px-2 rounded-full">{student.department}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Unified Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:p-6 border-b border-slate-50">
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all duration-200">
                  <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 leading-none">{coursesCount}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all duration-200">
                  <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 leading-none">{stats.graded}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Graded</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all duration-200">
                  <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-slate-505" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 leading-none">{stats.submitted}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white border border-slate-100 hover:shadow-sm transition-all duration-200">
                  <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-slate-505" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 leading-none">{stats.missing}</p>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Missing</p>
                  </div>
                </div>
              </div>

              {/* Courses & Assignments Grid */}
              <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100/80">
                
                {/* Enrolled Courses */}
                <div className="p-5 sm:p-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                    Enrolled Courses
                  </h4>
                  {courses.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center font-medium">No active course enrollments detected.</p>
                  ) : (
                    <div className="space-y-2">
                      {courses.map((course: any) => (
                        <div key={course.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/60 hover:bg-slate-50 hover:border-slate-200 transition-all duration-200">
                          <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0 shadow-sm">
                            {course.code?.slice(0, 3)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-700 truncate">{course.title}</p>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{course.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Assignments */}
                <div className="p-5 sm:p-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Recent Activity
                  </h4>
                  {assignments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center font-medium">No recent assignments found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {assignments.slice(0, 5).map((assignment: any) => {
                        const submission = submissions.find((s: any) => s.assignment_id === assignment.id)
                        const status = submission?.grade ? 'graded' : submission ? 'submitted' : 'missing'
                        
                        // Low-contrast elegant status coloring
                        const statusStyle = status === 'graded'
                          ? 'bg-indigo-50/70 text-indigo-700 border-indigo-100'
                          : status === 'submitted'
                            ? 'bg-slate-50 text-slate-600 border-slate-200/60'
                            : 'bg-orange-50/60 text-orange-800 border-orange-100'
                        const statusLabel = status === 'graded' ? 'Graded' : status === 'submitted' ? 'Submitted' : 'Not Submitted'

                        return (
                          <div key={assignment.id} className="p-3 rounded-xl bg-slate-50/50 border border-slate-100/60 hover:bg-slate-50 transition-all duration-200">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-700 truncate">{assignment.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="text-[9px] font-mono font-bold bg-white border border-slate-100 text-slate-500 rounded px-1.5 py-0.5">
                                    {assignment.courses?.code || 'Course'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                    <CalendarDays className="h-3 w-3 text-slate-400" />
                                    Due {formatDate(assignment.due_date)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <Badge className={`text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 border shadow-none rounded-md ${statusStyle} hover:${statusStyle}`}>
                                  {statusLabel}
                                </Badge>
                                {submission?.grade && (
                                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50/30 px-1 rounded">Score: {submission.grade}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CAMPUS ANNOUNCEMENTS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Campus Announcements</h3>
          </div>
          <Link href="/dashboard/notifications" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
            View all
          </Link>
        </div>

        {campusAnnouncements.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center font-medium">No announcements published.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {campusAnnouncements.map((announcement) => {
              const isUrgent = announcement.is_urgent
              const borderTheme = isUrgent ? 'border-orange-100 bg-orange-50/20' : 'border-slate-100 bg-slate-50/30'
              const accentColor = isUrgent ? 'bg-orange-500' : 'bg-slate-300'
              
              return (
                <div key={announcement.id} className={`relative flex flex-col justify-between rounded-xl border p-4 hover:shadow-sm hover:border-slate-200 transition-all duration-200 ${borderTheme} overflow-hidden`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {announcement.profiles?.full_name || 'Admin'}
                      </span>
                      {isUrgent && (
                        <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.2 text-[8px] font-bold tracking-wider uppercase text-orange-750 border border-orange-200/50">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
                      {announcement.content}
                    </p>
                  </div>
                  <p className="text-[9px] text-slate-400 font-medium pt-3 mt-3 border-t border-slate-100/50">
                    {formatDate(announcement.created_at)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
