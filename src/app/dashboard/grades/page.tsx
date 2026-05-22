import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award, BookOpen, CheckCircle2, Clock, FileText, MessageSquare, Users, ChevronRight } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

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
    <div className="w-full mx-auto max-w-7xl pb-10 space-y-6">
      
      {/* HEADER */}
      <header className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-50/60 flex items-center justify-center shrink-0 border border-indigo-100">
            <Award className="h-4.5 w-4.5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">My Grades</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">
              Track submitted work, lecturer feedback, and pending assignments.
            </p>
          </div>
        </div>
      </header>

      {/* STATS SUMMARY GRID (Unified Monochromatic Slate & Soft Indigo Theme) */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Graded Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex items-center gap-4 hover:shadow-xs transition-shadow duration-200 select-none">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">{graded.length}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2.5 leading-none">
              Graded Tasks
            </p>
          </div>
        </div>

        {/* Awaiting Grade Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex items-center gap-4 hover:shadow-xs transition-shadow duration-200 select-none">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <Clock className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">{submitted.length}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2.5 leading-none">
              Awaiting Grade
            </p>
          </div>
        </div>

        {/* Not Submitted Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex items-center gap-4 hover:shadow-xs transition-shadow duration-200 select-none">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <FileText className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">{missing.length}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2.5 leading-none">
              Not Submitted
            </p>
          </div>
        </div>
      </div>

      {/* GRADES LIST */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-12 text-center max-w-xl mx-auto mt-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
            <BookOpen className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h2 className="text-base font-semibold text-slate-800">No assignments yet</h2>
          <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
            Grades and feedback will appear here after your lecturers publish and grade assignments.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            let statusBadge = 'Awaiting Grade'
            
            if (row.status === 'graded') {
              statusBadge = 'Graded'
            } else if (row.status === 'missing') {
              statusBadge = 'Not Submitted'
            }

            return (
              <Link
                key={row.assignment.id}
                href={`/dashboard/courses/${row.assignment.course_id}?tab=assignments`}
                className="relative block bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 transition-all duration-200 hover:shadow-xs hover:border-slate-200 overflow-hidden group shadow-3xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 font-mono uppercase leading-none select-none">
                        {row.assignment.courses?.code || 'Course'}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none select-none">
                        {statusBadge}
                      </span>
                    </div>
                    
                    <h2 className="text-base font-semibold text-slate-850 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                      {row.assignment.title}
                    </h2>
                    
                    <p className="text-xs font-normal text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span>Due {formatDate(row.assignment.due_date)}</span>
                      {row.submission?.submitted_at && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                            Submitted {formatDate(row.submission.submitted_at)}
                          </span>
                        </>
                      )}
                    </p>
                    
                    {row.submission?.feedback && (
                      <div className="mt-4 rounded-xl bg-slate-50/40 border border-slate-100 p-4 relative overflow-hidden">
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-slate-300" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5 leading-none select-none">
                          <MessageSquare className="h-3 w-3 text-slate-400" strokeWidth={2.2} />
                          Lecturer Feedback
                        </p>
                        <p className="text-xs font-normal text-slate-600 whitespace-pre-wrap leading-relaxed pr-2">
                          {row.submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 sm:shrink-0 self-end sm:self-auto">
                    {/* Concentric Circle Grade Stamp */}
                    {row.status === 'graded' && row.submission?.grade && (
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden xs:block">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold select-none leading-none">Grade</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none select-none">Released</p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-3xs relative select-none shrink-0 group-hover:scale-105 transition-transform duration-200">
                          <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                            <span className="text-base font-bold text-slate-800 leading-none">
                              {row.submission.grade}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {row.status === 'submitted' && (
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden xs:block">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold select-none leading-none">Score</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none select-none">Pending</p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                            <Clock className="h-4.5 w-4.5 text-slate-400 animate-pulse" strokeWidth={1.8} />
                          </div>
                        </div>
                      </div>
                    )}

                    {row.status === 'missing' && (
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden xs:block">
                          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold select-none leading-none">Status</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none select-none">Missing</p>
                        </div>
                        <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-300">-</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-600 hidden sm:block shrink-0 ml-1" />
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
    <div className="w-full mx-auto max-w-7xl pb-10 space-y-6">
      
      {/* HEADER */}
      <header className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-50/60 flex items-center justify-center shrink-0 border border-indigo-100">
            <Award className="h-4.5 w-4.5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Grades Overview</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">
              Review grading progress and manage student feedback across your courses.
            </p>
          </div>
        </div>
      </header>

      {/* STATS SUMMARY GRID (Monochromatic Slate & Soft Indigo Theme) */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Submissions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex items-center gap-4 hover:shadow-xs transition-shadow duration-200 select-none">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <Users className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">{submissions.length}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2.5 leading-none">
              Total Submissions
            </p>
          </div>
        </div>

        {/* Graded Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex items-center gap-4 hover:shadow-xs transition-shadow duration-200 select-none">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">{gradedCount}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2.5 leading-none">
              Graded Tasks
            </p>
          </div>
        </div>

        {/* Needs Review Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 flex items-center gap-4 hover:shadow-xs transition-shadow duration-200 select-none">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 shrink-0">
            <Clock className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-semibold text-slate-900 tracking-tight leading-none">{pendingCount}</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2.5 leading-none">
              Needs Review
            </p>
          </div>
        </div>
      </div>

      {/* SUBMISSIONS DECK */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-6 select-none">
          <h3 className="text-base font-semibold text-slate-900">Recent Submissions</h3>
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-100 p-12 text-center max-w-xl mx-auto my-2">
            <div className="h-16 w-16 mx-auto rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
              <FileText className="h-7 w-7" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-slate-800">No submissions received</h2>
            <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">
              When students submit assignments for your courses, they will appear here for grading and feedback.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const href = submission.assignments 
                ? `/dashboard/courses/${submission.assignments.course_id}/assignments/${submission.assignment_id}` 
                : '/dashboard/grades'
              
              const statusLabel = submission.grade ? 'Graded' : 'Needs Review'
              
              return (
                <Link
                  key={submission.id}
                  href={href}
                  className="relative block bg-white rounded-2xl border border-slate-100 p-5 transition-all duration-200 hover:shadow-xs hover:border-slate-200 overflow-hidden group shadow-3xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-slate-500 font-mono uppercase leading-none select-none">
                          {submission.assignments?.courses?.code || 'Course'}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none select-none">
                          {statusLabel}
                        </span>
                      </div>
                      
                      <h2 className="text-base font-semibold text-slate-800 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors">
                        {submission.assignments?.title || 'Assignment'}
                      </h2>
                      
                      <p className="text-xs font-normal text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-700">{submission.profiles?.full_name || 'Student'}</span>
                        <span className="text-slate-300">•</span>
                        <span>Submitted {formatDate(submission.submitted_at)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4 sm:shrink-0 self-end sm:self-auto">
                      {submission.grade && (
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden xs:block">
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold select-none leading-none">Grade</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none select-none">Assigned</p>
                          </div>
                          <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shadow-3xs relative select-none shrink-0 group-hover:scale-105 transition-transform duration-200">
                            <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                              <span className="text-base font-bold text-slate-800 leading-none">
                                {submission.grade}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!submission.grade && (
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden xs:block">
                            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold select-none leading-none">Action</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none select-none">Review</p>
                          </div>
                          <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center">
                              <Clock className="h-4.5 w-4.5 text-slate-400 animate-pulse" strokeWidth={1.8} />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-600 hidden sm:block shrink-0 ml-1" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
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
