import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, BookOpen, CheckCircle2, Clock, FileText, MessageSquare, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Profile = {
  role?: string | null
}

type Course = {
  id: string
  code: string
  title: string
}

type EnrollmentRow = {
  course_id: string
}

type Assignment = {
  id: string
  course_id: string
  title: string
  due_date: string
  courses?: Pick<Course, 'code' | 'title'> | null
}

type Submission = {
  id: string
  assignment_id: string
  student_id: string
  file_url?: string | null
  grade?: string | null
  feedback?: string | null
  submitted_at?: string | null
  assignments?: (Pick<Assignment, 'id' | 'title' | 'due_date' | 'course_id'> & {
    courses?: Pick<Course, 'code' | 'title'> | null
  }) | null
  profiles?: {
    full_name?: string | null
    email?: string | null
  } | null
}

type StudentGradeRow = {
  assignment: Assignment
  submission?: Submission
  status: 'graded' | 'submitted' | 'missing'
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStudentRows(assignments: Assignment[], submissions: Submission[]) {
  return assignments.map((assignment): StudentGradeRow => {
    const submission = submissions.find((item) => item.assignment_id === assignment.id)
    const status = submission?.grade ? 'graded' : submission ? 'submitted' : 'missing'

    return { assignment, submission, status }
  })
}

async function StudentGrades({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', userId)

  const courseIds = ((enrollments || []) as EnrollmentRow[]).map((enrollment) => enrollment.course_id)

  let assignments: Assignment[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('assignments')
      .select('id, course_id, title, due_date, courses(code, title)')
      .in('course_id', courseIds)
      .order('due_date', { ascending: false })

    assignments = (data || []) as unknown as Assignment[]
  }

  const { data: submissionData } = await supabase
    .from('submissions')
    .select('id, assignment_id, student_id, file_url, grade, feedback, submitted_at')
    .eq('student_id', userId)

  const submissions = (submissionData || []) as Submission[]
  const rows = getStudentRows(assignments, submissions)
  const graded = rows.filter((row) => row.status === 'graded')
  const submitted = rows.filter((row) => row.status === 'submitted')
  const missing = rows.filter((row) => row.status === 'missing')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My Grades</h1>
          </div>
          <p className="text-muted-foreground">
            Track submitted work, lecturer feedback, and pending assignments.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{graded.length}</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{submitted.length}</p>
              <p className="text-xs text-muted-foreground">Awaiting Grade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{missing.length}</p>
              <p className="text-xs text-muted-foreground">Not Submitted</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">No assignments yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Grades and feedback will appear here after your lecturers create assignments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {rows.map((row) => {
            const statusStyle = row.status === 'graded'
              ? 'bg-green-50 text-green-700 border-green-200'
              : row.status === 'submitted'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'

            return (
              <Link
                key={row.assignment.id}
                href={`/dashboard/courses/${row.assignment.course_id}?tab=assignments`}
                className="block p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {row.assignment.courses?.code || 'Course'}
                      </Badge>
                      <Badge className={`text-[10px] h-5 border ${statusStyle}`}>
                        {row.status === 'graded' ? 'Graded' : row.status === 'submitted' ? 'Awaiting Grade' : 'Not Submitted'}
                      </Badge>
                    </div>
                    <h2 className="font-semibold text-gray-900 mt-2">{row.assignment.title}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {formatDate(row.assignment.due_date)}
                      {row.submission?.submitted_at ? ` - Submitted ${formatDate(row.submission.submitted_at)}` : ''}
                    </p>
                    {row.submission?.feedback && (
                      <div className="mt-3 rounded-lg bg-gray-50 border p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Lecturer Feedback
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.submission.feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    {row.submission?.grade && (
                      <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold">Score</p>
                        <p className="text-sm font-bold text-green-800">{row.submission.grade}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

async function LecturerGrades({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, code, title')
    .eq('lecturer_id', userId)
    .order('code', { ascending: true })

  const courses = (coursesData || []) as Course[]
  const courseIds = courses.map((course) => course.id)

  let assignments: Assignment[] = []
  if (courseIds.length > 0) {
    const { data } = await supabase
      .from('assignments')
      .select('id, course_id, title, due_date, courses(code, title)')
      .in('course_id', courseIds)
      .order('due_date', { ascending: false })

    assignments = (data || []) as unknown as Assignment[]
  }

  const assignmentIds = assignments.map((assignment) => assignment.id)

  let submissions: Submission[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, assignment_id, student_id, grade, feedback, submitted_at, assignments(id, title, due_date, course_id, courses(code, title)), profiles:student_id(full_name, email)')
      .in('assignment_id', assignmentIds)
      .order('submitted_at', { ascending: false })

    submissions = (data || []) as unknown as Submission[]
  }

  const gradedCount = submissions.filter((submission) => submission.grade).length
  const pendingCount = submissions.length - gradedCount

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center">
            <Award className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
        </div>
        <p className="text-muted-foreground">
          Review grading progress across your course assignments.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 p-2" />
            <div>
              <p className="text-2xl font-bold">{submissions.length}</p>
              <p className="text-xs text-muted-foreground">Submissions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-9 w-9 rounded-lg bg-green-50 text-green-700 p-2" />
            <div>
              <p className="text-2xl font-bold">{gradedCount}</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 p-2" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <p>No submissions received yet.</p>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {submissions.map((submission) => (
                <Link
                  key={submission.id}
                  href={submission.assignments ? `/dashboard/courses/${submission.assignments.course_id}/assignments/${submission.assignment_id}` : '/dashboard/grades'}
                  className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {submission.assignments?.courses?.code || 'Course'}
                      </Badge>
                      <Badge className={`text-[10px] h-5 border ${
                        submission.grade ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {submission.grade ? 'Graded' : 'Needs Review'}
                      </Badge>
                    </div>
                    <h2 className="font-semibold text-sm text-gray-900 mt-1">
                      {submission.assignments?.title || 'Assignment'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {submission.profiles?.full_name || 'Student'} - Submitted {formatDate(submission.submitted_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {submission.grade && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        {submission.grade}
                      </Badge>
                    )}
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

export default async function GradesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userProfile = profile as Profile | null

  if (userProfile?.role === 'admin') redirect('/dashboard/admin')
  if (userProfile?.role === 'lecturer') return <LecturerGrades userId={user.id} />

  return <StudentGrades userId={user.id} />
}
