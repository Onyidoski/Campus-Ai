import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users, BookOpen, FileText, Brain, TrendingUp,
  ChevronRight, CheckCircle2, Clock, AlertCircle
} from 'lucide-react'

export default async function StudentProgressPage() {
  const supabase = await createClient()

  // 1. Auth guard — lecturers only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'lecturer') redirect('/dashboard')

  // 2. Fetch all courses this lecturer teaches
  const { data: courses } = await supabase
    .from('courses')
    .select('id, code, title, level')
    .eq('lecturer_id', user.id)
    .order('code', { ascending: true })

  if (!courses || courses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
          <p className="text-muted-foreground mt-1">Track academic performance across your courses.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
          <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Courses Yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-1">
            Create your first course to start tracking student progress.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/courses">Go to Courses</Link>
          </Button>
        </div>
      </div>
    )
  }

  const courseIds = courses.map(c => c.id)

  // 3. Fetch all enrollments across lecturer's courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, student_id, enrolled_at, profiles:student_id(id, full_name, email, academic_level, department)')
    .in('course_id', courseIds)
    .order('enrolled_at', { ascending: false })

  // 4. Fetch all assignments for these courses
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, course_id, title')
    .in('course_id', courseIds)

  // 5. Fetch all submissions for these assignments
  const assignmentIds = assignments?.map(a => a.id) || []
  let submissions: any[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, assignment_id, student_id, grade, submitted_at')
      .in('assignment_id', assignmentIds)
    submissions = data || []
  }

  // 6. Fetch quiz scores for these courses
  let quizScores: any[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('quiz_scores')
      .select('id, user_id, course_id, score, total, difficulty, created_at')
      .in('course_id', courseIds)
    quizScores = data || []
  }

  // 7. Build per-course stats
  const courseStats = courses.map(course => {
    const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || []
    const courseAssignments = assignments?.filter(a => a.course_id === course.id) || []
    const courseAssignmentIds = courseAssignments.map(a => a.id)
    const courseSubmissions = submissions.filter(s => courseAssignmentIds.includes(s.assignment_id))
    const courseQuizzes = quizScores.filter(q => q.course_id === course.id)

    // Graded submissions
    const gradedSubmissions = courseSubmissions.filter(s => s.grade)

    // Per-student stats
    const studentStats = courseEnrollments.map(enrollment => {
      const studentProfile = enrollment.profiles as any
      const studentId = studentProfile?.id

      // How many assignments did this student submit?
      const studentSubmissions = courseSubmissions.filter(s => s.student_id === studentId)
      const studentGradedSubmissions = studentSubmissions.filter(s => s.grade)

      // Quiz performance
      const studentQuizzes = courseQuizzes.filter(q => q.user_id === studentId)
      const avgQuizScore = studentQuizzes.length > 0
        ? Math.round(studentQuizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / studentQuizzes.length)
        : null

      return {
        id: studentId,
        name: studentProfile?.full_name || 'Unknown',
        email: studentProfile?.email || '',
        level: studentProfile?.academic_level,
        department: studentProfile?.department,
        enrolledAt: enrollment.enrolled_at,
        submissionCount: studentSubmissions.length,
        gradedCount: studentGradedSubmissions.length,
        totalAssignments: courseAssignments.length,
        quizCount: studentQuizzes.length,
        avgQuizScore,
      }
    })

    return {
      ...course,
      studentCount: courseEnrollments.length,
      assignmentCount: courseAssignments.length,
      totalSubmissions: courseSubmissions.length,
      totalGraded: gradedSubmissions.length,
      quizAttempts: courseQuizzes.length,
      students: studentStats,
    }
  })

  // Overall stats
  const totalStudents = new Set(enrollments?.map(e => (e.profiles as any)?.id).filter(Boolean)).size
  const totalAssignments = assignments?.length || 0
  const totalSubmissions = submissions.length
  const totalQuizAttempts = quizScores.length

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-1">
          Track academic performance across your {courses.length} course{courses.length === 1 ? '' : 's'}.
        </p>
      </div>

      {/* OVERVIEW STATS */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalAssignments}</p>
              <p className="text-xs text-muted-foreground">Assignments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubmissions}</p>
              <p className="text-xs text-muted-foreground">Submissions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalQuizAttempts}</p>
              <p className="text-xs text-muted-foreground">Quiz Attempts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PER-COURSE BREAKDOWN */}
      <div className="space-y-6">
        {courseStats.map(course => (
          <Card key={course.id} className="overflow-hidden">
            {/* Course Header */}
            <CardHeader className="bg-gray-50/60 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs font-mono bg-white">{course.code}</Badge>
                    <span className="text-xs text-muted-foreground">{course.level} Level</span>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {course.studentCount} student{course.studentCount === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {course.assignmentCount} assignment{course.assignmentCount === 1 ? '' : 's'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="h-3.5 w-3.5" /> {course.quizAttempts} quiz{course.quizAttempts === 1 ? '' : 'zes'}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {course.students.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No students enrolled yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Table Header */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/40">
                    <div className="col-span-4">Student</div>
                    <div className="col-span-3">Assignments</div>
                    <div className="col-span-3">Quiz Performance</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>

                  {/* Student Rows */}
                  {course.students.map(student => {
                    const submissionRate = course.assignmentCount > 0
                      ? Math.round((student.submissionCount / course.assignmentCount) * 100)
                      : 0
                    const initial = student.name?.charAt(0).toUpperCase() || '?'

                    return (
                      <div key={student.id || student.email} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center">
                        {/* Student Info */}
                        <div className="md:col-span-4 flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-sm font-bold text-indigo-700 shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{student.email}</p>
                          </div>
                        </div>

                        {/* Assignments Progress */}
                        <div className="md:col-span-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-gray-500">
                              {student.submissionCount}/{course.assignmentCount} submitted
                            </span>
                            <span className="text-xs font-semibold text-gray-700">{submissionRate}%</span>
                          </div>
                          <Progress value={submissionRate} className="h-2" />
                          {student.gradedCount > 0 && (
                            <p className="text-[10px] text-green-600 mt-1 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> {student.gradedCount} graded
                            </p>
                          )}
                        </div>

                        {/* Quiz Performance */}
                        <div className="md:col-span-3">
                          {student.quizCount > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                (student.avgQuizScore ?? 0) >= 70
                                  ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                                  : (student.avgQuizScore ?? 0) >= 50
                                    ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200'
                                    : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                              }`}>
                                {student.avgQuizScore}%
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700">Avg. Score</p>
                                <p className="text-[10px] text-gray-400">{student.quizCount} quiz{student.quizCount === 1 ? '' : 'zes'} taken</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No quizzes taken</span>
                          )}
                        </div>

                        {/* Action */}
                        <div className="md:col-span-2 flex justify-end">
                          <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-indigo-600" asChild>
                            <Link href={`/dashboard/courses/${course.id}?tab=people`}>
                              View <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
