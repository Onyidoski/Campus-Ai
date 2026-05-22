import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Users,
  Video,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

type Course = {
  id: string
  code: string
  title: string
  level?: string | null
  lecturer_id?: string | null
}

type CountRow = {
  course_id: string
}

type Assignment = {
  id: string
  course_id: string
}

type Submission = {
  id: string
  assignment_id: string
  grade?: string | null
}

type DiscussionPost = {
  id: string
  course_id: string
  is_answered?: boolean | null
}

function percent(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

function countByCourse(rows: CountRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.course_id] = (acc[row.course_id] || 0) + 1
    return acc
  }, {})
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { data: coursesData },
    { data: enrollmentsData },
    { data: materialsData },
    { data: assignmentsData },
    { data: onlineClassesData },
    { data: discussionsData },
    { data: submissionsData },
    { count: totalStudents },
    { count: studentsWithoutLevel },
  ] = await Promise.all([
    supabase.from('courses').select('id, code, title, level, lecturer_id').order('code', { ascending: true }),
    supabase.from('enrollments').select('course_id'),
    supabase.from('materials').select('course_id'),
    supabase.from('assignments').select('id, course_id'),
    supabase.from('online_classes').select('course_id'),
    supabase.from('discussion_posts').select('id, course_id, is_answered'),
    supabase.from('submissions').select('id, assignment_id, grade'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').is('academic_level', null),
  ])

  const courses = (coursesData || []) as Course[]
  const enrollments = (enrollmentsData || []) as CountRow[]
  const materials = (materialsData || []) as CountRow[]
  const assignments = (assignmentsData || []) as Assignment[]
  const onlineClasses = (onlineClassesData || []) as CountRow[]
  const discussions = (discussionsData || []) as DiscussionPost[]
  const submissions = (submissionsData || []) as Submission[]

  const assignmentCourseMap = new Map(assignments.map((assignment) => [assignment.id, assignment.course_id]))
  const enrollmentCounts = countByCourse(enrollments)
  const materialCounts = countByCourse(materials)
  const classCounts = countByCourse(onlineClasses)
  const assignmentCounts = countByCourse(assignments)
  const discussionCounts = countByCourse(discussions)

  const submissionCounts = submissions.reduce<Record<string, number>>((acc, submission) => {
    const courseId = assignmentCourseMap.get(submission.assignment_id)
    if (!courseId) return acc
    acc[courseId] = (acc[courseId] || 0) + 1
    return acc
  }, {})

  const ungradedCount = submissions.filter((submission) => !submission.grade).length
  const unansweredDiscussions = discussions.filter((post) => !post.is_answered).length

  const courseHealth = courses.map((course) => {
    const enrollmentsForCourse = enrollmentCounts[course.id] || 0
    const materialsForCourse = materialCounts[course.id] || 0
    const assignmentsForCourse = assignmentCounts[course.id] || 0
    const submissionsForCourse = submissionCounts[course.id] || 0
    const classesForCourse = classCounts[course.id] || 0
    const discussionsForCourse = discussionCounts[course.id] || 0

    const score =
      (course.lecturer_id ? 20 : 0) +
      Math.min(materialsForCourse, 3) * 15 +
      Math.min(assignmentsForCourse, 2) * 12 +
      Math.min(classesForCourse, 2) * 8 +
      Math.min(discussionsForCourse, 3) * 4

    return {
      ...course,
      enrollments: enrollmentsForCourse,
      materials: materialsForCourse,
      assignments: assignmentsForCourse,
      submissions: submissionsForCourse,
      classes: classesForCourse,
      discussions: discussionsForCourse,
      score: Math.min(score, 100),
    }
  })

  const topCourses = [...courseHealth]
    .sort((a, b) => (b.enrollments + b.submissions + b.discussions) - (a.enrollments + a.submissions + a.discussions))
    .slice(0, 5)

  const coursesNeedingAttention = courseHealth
    .filter((course) => !course.lecturer_id || course.materials === 0 || course.assignments === 0 || course.enrollments === 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)

  const submissionRate = percent(submissions.length, Math.max(assignments.length, 1) * Math.max(enrollments.length, 1))

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/45">
            <BarChart3 className="h-4.5 w-4.5 text-indigo-650" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Analytics</h1>
        </div>
        <p className="text-xs text-slate-455 mt-1 pl-11">
          Usage signals, course health parameters, and operational gaps across the campus.
        </p>
      </div>

      {/* METRIC CARD DECK */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={BookOpen}
          label="Courses"
          value={courses.length}
          helper={`${courses.filter((course) => !course.lecturer_id).length} without assigned lecturers`}
          tone="blue"
        />
        <MetricCard
          icon={FileText}
          label="Materials"
          value={materials.length}
          helper={`${courses.filter((course) => (materialCounts[course.id] || 0) === 0).length} courses without resources`}
          tone="emerald"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Submissions"
          value={submissions.length}
          helper={`${ungradedCount} pending grading evaluation`}
          tone="amber"
        />
        <MetricCard
          icon={MessageSquare}
          label="Discussions"
          value={discussions.length}
          helper={`${unansweredDiscussions} open student questions`}
          tone="violet"
        />
      </div>

      {/* TWO-COLUMN GRID */}
      <div className="grid gap-6 xl:grid-cols-[1.24fr_0.76fr]">
        
        {/* COURSE HEALTH */}
        <div className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-slate-900" />
              Course Health
            </h2>
          </div>
          <div className="p-0">
            {courseHealth.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-light text-sm">No courses recorded.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {courseHealth.map((course) => (
                  <Link key={course.id} href="/dashboard/admin/courses" className="block p-4 sm:p-5 hover:bg-slate-50/30 transition-colors duration-150">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Name / Badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-mono bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {course.code}
                          </span>
                          <span className="bg-indigo-50 border border-indigo-100/40 text-indigo-655 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            {course.level || 'N/A'} Level
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-normal whitespace-normal">{course.title}</p>
                      </div>

                      {/* Metrics counts */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-bold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {course.enrollments} Enrolled
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {course.materials} Materials
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {course.classes} Classes
                        </span>
                      </div>

                      {/* Color-coded health metrics */}
                      <div className="w-full lg:w-44 shrink-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Health</span>
                          <span className={`text-xs font-extrabold ${
                            course.score >= 80 ? 'text-indigo-655' : course.score >= 40 ? 'text-slate-700' : 'text-rose-600'
                          }`}>{course.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              course.score >= 80 ? 'bg-indigo-650' : course.score >= 40 ? 'bg-indigo-400' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${course.score}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* GAPS & COMPLIANCE SIDEBAR */}
        <div className="space-y-6">
          
          {/* NEEDS ATTENTION */}
          <div className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="h-4.5 w-4.5 text-rose-650" />
                Needs Attention
              </h2>
            </div>
            <div className="p-0">
              {coursesNeedingAttention.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400 font-light">No outstanding course gaps.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {coursesNeedingAttention.map((course) => (
                    <Link key={course.id} href="/dashboard/admin/courses" className="block p-4 hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800">{course.code}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {!course.lecturer_id && (
                              <span className="bg-rose-50 border border-rose-100/50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                                No lecturer
                              </span>
                            )}
                            {course.materials === 0 && (
                              <span className="bg-rose-50 border border-rose-100/50 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                                No materials
                              </span>
                            )}
                            {course.assignments === 0 && (
                              <span className="bg-slate-50 border border-slate-200/50 text-slate-655 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                                No assignments
                              </span>
                            )}
                            {course.enrollments === 0 && (
                              <span className="bg-slate-50 border border-slate-200/50 text-slate-655 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                                No students
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-455 shrink-0">{course.score}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STUDENT SETUP */}
          <div className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
            <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-slate-900" />
                Student Setup
              </h2>
            </div>
            <div className="p-5 space-y-5 bg-white">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Students with academic level</span>
                  <span className="text-xs font-extrabold text-slate-800">
                    {(totalStudents || 0) - (studentsWithoutLevel || 0)}/{totalStudents || 0}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-655 rounded-full transition-all duration-500" 
                    style={{ width: `${percent((totalStudents || 0) - (studentsWithoutLevel || 0), totalStudents || 0)}%` }} 
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700">Rough submission activity</span>
                  <span className="text-xs font-extrabold text-slate-800">{submissionRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-655 rounded-full transition-all duration-500" 
                    style={{ width: `${submissionRate}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOST ACTIVE COURSES */}
      <div className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl mt-6">
        <div className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-slate-900" />
            Most Active Courses
          </h2>
        </div>
        <div className="p-0">
          {topCourses.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 font-light">No activity recorded.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {topCourses.map((course, index) => (
                <Link key={course.id} href="/dashboard/admin/courses" className="block p-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Medal Rank & Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-black text-indigo-655 bg-indigo-50 border border-indigo-100/50 rounded-lg h-7 w-7 flex items-center justify-center shrink-0">
                        #{index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">{course.code}</p>
                        <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">{course.title}</p>
                      </div>
                    </div>
                    
                    {/* Counters */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-bold text-slate-500 sm:justify-end">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {course.enrollments} Enrolled
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {course.submissions} Submissions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {course.discussions} Posts
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof BookOpen
  label: string
  value: number
  helper: string
  tone: 'blue' | 'emerald' | 'amber' | 'violet'
}) {
  const tones = {
    blue: { iconBg: 'bg-indigo-50 border-indigo-100/50 text-indigo-655' },
    emerald: { iconBg: 'bg-indigo-50 border-indigo-100/50 text-indigo-655' },
    amber: { iconBg: 'bg-rose-50 border-rose-100/50 text-rose-600' },
    violet: { iconBg: 'bg-slate-50 border-slate-100 text-slate-600' },
  }
  const currentTone = tones[tone] || tones.blue

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-row items-center gap-3.5 hover:shadow-md transition-all duration-300">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border ${currentTone.iconBg}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wide truncate mt-0.5">{label}</p>
        <p className="text-[10px] text-slate-400 font-medium truncate mt-1" title={helper}>{helper}</p>
      </div>
    </div>
  )
}
