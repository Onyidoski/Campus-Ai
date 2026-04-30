import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  FileText,
  Lightbulb,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Profile = {
  role?: string | null
}

type Course = {
  id: string
  code: string
  title: string
  level?: string | null
}

type EnrollmentRow = {
  course_id: string
  courses?: Course | Course[] | null
}

type Material = {
  id: string
  course_id: string
  title: string
  file_type?: string | null
  created_at?: string | null
}

type Assignment = {
  id: string
  course_id: string
  title: string
  due_date?: string | null
  courses?: Pick<Course, 'code' | 'title'> | null
}

type Submission = {
  id: string
  assignment_id: string
  student_id?: string | null
  grade?: string | null
  submitted_at?: string | null
}

type QuizScore = {
  course_id: string
  score: number
  total: number
}

type DiscussionPost = {
  id: string
  course_id: string
  title: string
  is_answered?: boolean | null
  created_at?: string | null
  courses?: Pick<Course, 'code' | 'title'> | null
}

type Recommendation = {
  id: string
  title: string
  description: string
  href: string
  label: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet'
  icon: typeof Lightbulb
  priority: number
}

function normalizeJoinedCourse(courses: EnrollmentRow['courses']) {
  return Array.isArray(courses) ? courses[0] : courses
}

function getToneClasses(tone: Recommendation['tone']) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  }

  return tones[tone]
}

function sortRecommendations(items: Recommendation[]) {
  return [...items].sort((a, b) => b.priority - a.priority)
}

async function StudentRecommendations({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('course_id, courses(id, code, title, level)')
    .eq('student_id', userId)

  const enrollments = (enrollmentData || []) as unknown as EnrollmentRow[]
  const courses = enrollments
    .map((enrollment) => normalizeJoinedCourse(enrollment.courses))
    .filter((course): course is Course => Boolean(course))
  const courseIds = courses.map((course) => course.id)

  let materials: Material[] = []
  let assignments: Assignment[] = []
  let quizScores: QuizScore[] = []

  if (courseIds.length > 0) {
    const [materialsResult, assignmentsResult, quizScoresResult] = await Promise.all([
      supabase
        .from('materials')
        .select('id, course_id, title, file_type, created_at')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('assignments')
        .select('id, course_id, title, due_date, courses(code, title)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true }),
      supabase
        .from('quiz_scores')
        .select('course_id, score, total')
        .eq('user_id', userId)
        .in('course_id', courseIds),
    ])

    materials = (materialsResult.data || []) as Material[]
    assignments = (assignmentsResult.data || []) as unknown as Assignment[]
    quizScores = (quizScoresResult.data || []) as QuizScore[]
  }

  const assignmentIds = assignments.map((assignment) => assignment.id)
  let submissions: Submission[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, assignment_id, grade, submitted_at')
      .eq('student_id', userId)
      .in('assignment_id', assignmentIds)

    submissions = (data || []) as Submission[]
  }

  const submittedIds = new Set(submissions.map((submission) => submission.assignment_id))
  const now = new Date()
  const dueSoon = assignments.filter((assignment) => {
    if (submittedIds.has(assignment.id) || !assignment.due_date) return false
    const dueDate = new Date(assignment.due_date)
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / 86_400_000
    return daysUntilDue >= 0 && daysUntilDue <= 7
  })

  const lowQuizCourses = courses.filter((course) => {
    const scores = quizScores.filter((score) => score.course_id === course.id && score.total > 0)
    if (scores.length === 0) return false
    const average = scores.reduce((sum, item) => sum + (item.score / item.total) * 100, 0) / scores.length
    return average < 60
  })

  const recommendations: Recommendation[] = [
    ...dueSoon.slice(0, 4).map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: `Submit ${assignment.title}`,
      description: `${assignment.courses?.code || 'Course'} is due soon. Open the assignment tab and submit before the deadline.`,
      href: `/dashboard/courses/${assignment.course_id}?tab=assignments`,
      label: 'Due Soon',
      tone: 'amber' as const,
      icon: AlertCircle,
      priority: 100,
    })),
    ...lowQuizCourses.slice(0, 3).map((course) => ({
      id: `quiz-${course.id}`,
      title: `Practice ${course.code}`,
      description: 'Your recent quiz performance suggests this course needs extra revision. Generate a practice quiz or flashcards.',
      href: `/dashboard/courses/${course.id}?tab=study`,
      label: 'Practice',
      tone: 'rose' as const,
      icon: Brain,
      priority: 90,
    })),
    ...materials.slice(0, 5).map((material) => {
      const course = courses.find((item) => item.id === material.course_id)
      return {
        id: `material-${material.id}`,
        title: material.title,
        description: `Review this ${material.file_type || 'material'} from ${course?.code || 'your course'} and ask Campus AI to summarize it.`,
        href: `/dashboard/courses/${material.course_id}?tab=materials`,
        label: 'Recommended Material',
        tone: 'blue' as const,
        icon: FileText,
        priority: 60,
      }
    }),
  ]

  if (recommendations.length === 0 && courses.length > 0) {
    recommendations.push(
      ...courses.slice(0, 3).map((course) => ({
        id: `course-${course.id}`,
        title: `Explore ${course.code}`,
        description: 'Open this course to review materials, discussions, assignments, and study tools.',
        href: `/dashboard/courses/${course.id}`,
        label: 'Course Focus',
        tone: 'emerald' as const,
        icon: BookOpen,
        priority: 40,
      }))
    )
  }

  return (
    <RecommendationsShell
      title="Recommendations"
      description="Suggested materials, practice tasks, and next actions based on your courses."
      items={sortRecommendations(recommendations)}
      emptyTitle={courses.length === 0 ? 'No courses yet' : 'Nothing urgent right now'}
      emptyDescription={
        courses.length === 0
          ? 'Enroll in courses first, then recommendations will appear here.'
          : 'You are caught up. Check back after new materials, assignments, or quiz activity.'
      }
    />
  )
}

async function LecturerRecommendations({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: courseData } = await supabase
    .from('courses')
    .select('id, code, title, level')
    .eq('lecturer_id', userId)
    .order('code', { ascending: true })

  const courses = (courseData || []) as Course[]
  const courseIds = courses.map((course) => course.id)

  let materials: Material[] = []
  let assignments: Assignment[] = []
  let discussions: DiscussionPost[] = []

  if (courseIds.length > 0) {
    const [materialsResult, assignmentsResult, discussionsResult] = await Promise.all([
      supabase
        .from('materials')
        .select('id, course_id, title, file_type, created_at')
        .in('course_id', courseIds),
      supabase
        .from('assignments')
        .select('id, course_id, title, due_date, courses(code, title)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: false }),
      supabase
        .from('discussion_posts')
        .select('id, course_id, title, is_answered, created_at, courses(code, title)')
        .in('course_id', courseIds)
        .eq('is_answered', false)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    materials = (materialsResult.data || []) as Material[]
    assignments = (assignmentsResult.data || []) as unknown as Assignment[]
    discussions = (discussionsResult.data || []) as unknown as DiscussionPost[]
  }

  const assignmentIds = assignments.map((assignment) => assignment.id)
  let submissions: Submission[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, assignment_id, grade, submitted_at')
      .in('assignment_id', assignmentIds)

    submissions = (data || []) as Submission[]
  }

  const recommendations: Recommendation[] = []

  courses.forEach((course) => {
    const courseMaterials = materials.filter((material) => material.course_id === course.id)
    if (courseMaterials.length < 2) {
      recommendations.push({
        id: `materials-${course.id}`,
        title: `Add more materials to ${course.code}`,
        description: 'This course has limited uploaded content. Add PDFs, slides, or notes so students and Campus AI have more context.',
        href: `/dashboard/courses/${course.id}?tab=materials`,
        label: 'Content Gap',
        tone: 'amber',
        icon: FileText,
        priority: 95,
      })
    }
  })

  assignments.forEach((assignment) => {
    const assignmentSubmissions = submissions.filter((submission) => submission.assignment_id === assignment.id)
    const ungraded = assignmentSubmissions.filter((submission) => !submission.grade)
    if (ungraded.length > 0) {
      recommendations.push({
        id: `grade-${assignment.id}`,
        title: `Grade ${ungraded.length} submission${ungraded.length === 1 ? '' : 's'}`,
        description: `${assignment.courses?.code || 'Course'}: ${assignment.title} has work waiting for review.`,
        href: `/dashboard/courses/${assignment.course_id}/assignments/${assignment.id}`,
        label: 'Needs Grading',
        tone: 'rose',
        icon: CheckCircle2,
        priority: 100,
      })
    }
  })

  discussions.forEach((post) => {
    recommendations.push({
      id: `discussion-${post.id}`,
      title: `Answer: ${post.title}`,
      description: `${post.courses?.code || 'Course'} has an unanswered discussion. Respond or mark the best reply as answered.`,
      href: `/dashboard/courses/${post.course_id}/discussions/${post.id}`,
      label: 'Unanswered',
      tone: 'violet',
      icon: MessageSquare,
      priority: 80,
    })
  })

  if (recommendations.length === 0 && courses.length > 0) {
    recommendations.push(
      ...courses.slice(0, 3).map((course) => ({
        id: `course-${course.id}`,
        title: `Review ${course.code}`,
        description: 'Open this course to check materials, assignments, classes, and student activity.',
        href: `/dashboard/courses/${course.id}`,
        label: 'Course Check',
        tone: 'emerald' as const,
        icon: BookOpen,
        priority: 40,
      }))
    )
  }

  return (
    <RecommendationsShell
      title="Recommendations"
      description="Suggested actions to improve course coverage, grading, and student support."
      items={sortRecommendations(recommendations)}
      emptyTitle={courses.length === 0 ? 'No courses yet' : 'All caught up'}
      emptyDescription={
        courses.length === 0
          ? 'Create a course first, then teaching recommendations will appear here.'
          : 'No grading, material, or discussion issues need attention right now.'
      }
    />
  )
}

function RecommendationsShell({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  description: string
  items: Recommendation[]
  emptyTitle: string
  emptyDescription: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{emptyTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{emptyDescription}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <Link key={item.id} href={item.href} className="group block">
                <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-gray-300 group-hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 ${getToneClasses(item.tone)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className={`text-[10px] h-5 border ${getToneClasses(item.tone)}`}>
                        {item.label}
                      </Badge>
                    </div>

                    <h2 className="mt-4 font-semibold text-gray-900 leading-snug">{item.title}</h2>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{item.description}</p>
                    <p className="mt-4 text-xs font-medium text-gray-400 group-hover:text-gray-700">
                      Open recommendation
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default async function RecommendationsPage() {
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
  if (userProfile?.role === 'lecturer') return <LecturerRecommendations userId={user.id} />

  return <StudentRecommendations userId={user.id} />
}
