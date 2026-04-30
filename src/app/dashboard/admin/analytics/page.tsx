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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

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
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <BarChart3 className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Usage signals and operational gaps across the campus learning system.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpen} label="Courses" value={courses.length} helper={`${courses.filter((course) => !course.lecturer_id).length} without lecturers`} tone="blue" />
        <MetricCard icon={FileText} label="Materials" value={materials.length} helper={`${courses.filter((course) => (materialCounts[course.id] || 0) === 0).length} courses without materials`} tone="emerald" />
        <MetricCard icon={CheckCircle2} label="Submissions" value={submissions.length} helper={`${ungradedCount} ungraded`} tone="amber" />
        <MetricCard icon={MessageSquare} label="Discussions" value={discussions.length} helper={`${unansweredDiscussions} unanswered`} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Course Health
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {courseHealth.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No courses yet.</div>
            ) : (
              <div className="divide-y">
                {courseHealth.map((course) => (
                  <Link key={course.id} href="/dashboard/admin/courses" className="block p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid gap-3 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-4 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono">{course.code}</Badge>
                          <Badge variant="secondary">{course.level || 'N/A'} Level</Badge>
                        </div>
                        <p className="font-semibold text-sm text-gray-900 truncate">{course.title}</p>
                      </div>
                      <div className="lg:col-span-5 grid grid-cols-3 gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {course.enrollments} enrolled</span>
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {course.materials}</span>
                        <span className="flex items-center gap-1"><Video className="h-3 w-3" /> {course.classes}</span>
                      </div>
                      <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Health</span>
                          <span className="text-xs font-semibold">{course.score}%</span>
                        </div>
                        <Progress value={course.score} className="h-2" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {coursesNeedingAttention.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No obvious course gaps.</div>
              ) : (
                <div className="divide-y">
                  {coursesNeedingAttention.map((course) => (
                    <Link key={course.id} href="/dashboard/admin/courses" className="block p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{course.code}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {!course.lecturer_id && <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">No lecturer</Badge>}
                            {course.materials === 0 && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">No materials</Badge>}
                            {course.assignments === 0 && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">No assignments</Badge>}
                            {course.enrollments === 0 && <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-[10px]">No students</Badge>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{course.score}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                Student Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Students with academic level</span>
                  <span className="text-sm font-semibold">
                    {(totalStudents || 0) - (studentsWithoutLevel || 0)}/{totalStudents || 0}
                  </span>
                </div>
                <Progress value={percent((totalStudents || 0) - (studentsWithoutLevel || 0), totalStudents || 0)} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Rough submission activity</span>
                  <span className="text-sm font-semibold">{submissionRate}%</span>
                </div>
                <Progress value={submissionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Most Active Courses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {topCourses.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="divide-y">
              {topCourses.map((course, index) => (
                <Link key={course.id} href="/dashboard/admin/courses" className="grid grid-cols-12 gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="col-span-1 text-sm font-bold text-gray-400">#{index + 1}</div>
                  <div className="col-span-5">
                    <p className="font-semibold text-sm text-gray-900">{course.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{course.title}</p>
                  </div>
                  <div className="col-span-6 grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <span>{course.enrollments} enrolled</span>
                    <span>{course.submissions} submissions</span>
                    <span>{course.discussions} posts</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
  icon: typeof BarChart3
  label: string
  value: number
  helper: string
  tone: 'blue' | 'emerald' | 'amber' | 'violet'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-l-blue-500',
    emerald: 'bg-emerald-50 text-emerald-700 border-l-emerald-500',
    amber: 'bg-amber-50 text-amber-700 border-l-amber-500',
    violet: 'bg-violet-50 text-violet-700 border-l-violet-500',
  }

  return (
    <Card className={`border-l-4 ${tones[tone].split(' ').at(-1)}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{helper}</p>
        </div>
      </CardContent>
    </Card>
  )
}
