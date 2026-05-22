import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/server'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Profile = { role?: string | null }

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizeJoinedCourse(courses: EnrollmentRow['courses']) {
  return Array.isArray(courses) ? courses[0] : courses
}

/* ------------------------------------------------------------------ */
/*  Section / Item types for the feed                                  */
/* ------------------------------------------------------------------ */

type FeedItem = {
  id: string
  title: string
  description: string
  href: string
  tag: string
}

type FeedSection = {
  key: string
  title: string
  icon: typeof Sparkles
  items: FeedItem[]
  // style tokens
  accentFrom: string
  accentTo: string
  hoverBg: string
  dotColor: string
  tagBg: string
  tagText: string
  iconBg: string
  iconBorder: string
  iconColor: string
}

/* ------------------------------------------------------------------ */
/*  Student Recommendations                                            */
/* ------------------------------------------------------------------ */

async function StudentRecommendations({ userId }: { userId: string }) {
  const supabase = await createClient()

  /* ---------- data fetching (unchanged logic) ---------- */

  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('course_id, courses(id, code, title, level)')
    .eq('student_id', userId)

  const enrollments = (enrollmentData || []) as unknown as EnrollmentRow[]
  const courses = enrollments
    .map((e) => normalizeJoinedCourse(e.courses))
    .filter((c): c is Course => Boolean(c))
  const courseIds = courses.map((c) => c.id)

  let materials: Material[] = []
  let assignments: Assignment[] = []
  let quizScores: QuizScore[] = []

  if (courseIds.length > 0) {
    const [matRes, asnRes, qzRes] = await Promise.all([
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

    materials = (matRes.data || []) as Material[]
    assignments = (asnRes.data || []) as unknown as Assignment[]
    quizScores = (qzRes.data || []) as QuizScore[]
  }

  const assignmentIds = assignments.map((a) => a.id)
  let submissions: Submission[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, assignment_id, grade, submitted_at')
      .eq('student_id', userId)
      .in('assignment_id', assignmentIds)
    submissions = (data || []) as Submission[]
  }

  const submittedIds = new Set(submissions.map((s) => s.assignment_id))
  const now = new Date()

  const dueSoon = assignments.filter((a) => {
    if (submittedIds.has(a.id) || !a.due_date) return false
    const days = (new Date(a.due_date).getTime() - now.getTime()) / 86_400_000
    return days >= 0 && days <= 7
  })

  const lowQuizCourses = courses.filter((c) => {
    const scores = quizScores.filter((s) => s.course_id === c.id && s.total > 0)
    if (scores.length === 0) return false
    const avg = scores.reduce((sum, s) => sum + (s.score / s.total) * 100, 0) / scores.length
    return avg < 60
  })

  /* ---------- build feed sections ---------- */

  const sections: FeedSection[] = []

  if (dueSoon.length > 0) {
    sections.push({
      key: 'urgent',
      title: 'Needs Attention',
      icon: AlertCircle,
      accentFrom: '#f59e0b',
      accentTo: '#f97316',
      hoverBg: 'rgba(245,158,11,0.05)',
      dotColor: '#f59e0b',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-700',
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-200/60',
      iconColor: 'text-amber-600',
      items: dueSoon.slice(0, 4).map((a) => ({
        id: `a-${a.id}`,
        title: `Submit ${a.title}`,
        description: `${a.courses?.code || 'Course'} is due soon. Open the assignment tab and submit before the deadline.`,
        href: `/dashboard/courses/${a.course_id}?tab=assignments`,
        tag: 'Due Soon',
      })),
    })
  }

  if (lowQuizCourses.length > 0) {
    sections.push({
      key: 'practice',
      title: 'Practice & Review',
      icon: Brain,
      accentFrom: '#f43f5e',
      accentTo: '#e11d48',
      hoverBg: 'rgba(244,63,94,0.05)',
      dotColor: '#f43f5e',
      tagBg: 'bg-rose-100',
      tagText: 'text-rose-700',
      iconBg: 'bg-rose-50',
      iconBorder: 'border-rose-200/60',
      iconColor: 'text-rose-600',
      items: lowQuizCourses.slice(0, 3).map((c) => ({
        id: `q-${c.id}`,
        title: `Practice ${c.code}`,
        description:
          'Your recent quiz performance suggests this course needs extra revision. Generate a practice quiz or flashcards.',
        href: `/dashboard/courses/${c.id}?tab=study`,
        tag: 'Practice',
      })),
    })
  }

  if (materials.length > 0) {
    sections.push({
      key: 'materials',
      title: 'New Materials',
      icon: FileText,
      accentFrom: '#3b82f6',
      accentTo: '#6366f1',
      hoverBg: 'rgba(59,130,246,0.05)',
      dotColor: '#3b82f6',
      tagBg: 'bg-blue-100',
      tagText: 'text-blue-700',
      iconBg: 'bg-blue-50',
      iconBorder: 'border-blue-200/60',
      iconColor: 'text-blue-600',
      items: materials.slice(0, 5).map((m) => {
        const course = courses.find((c) => c.id === m.course_id)
        return {
          id: `m-${m.id}`,
          title: m.title,
          description: `Review this ${m.file_type || 'material'} from ${course?.code || 'your course'} and ask Campus AI to summarize it.`,
          href: `/dashboard/courses/${m.course_id}?tab=materials`,
          tag: 'New Material',
        }
      }),
    })
  }

  // fallback: explore courses
  if (sections.length === 0 && courses.length > 0) {
    sections.push({
      key: 'explore',
      title: 'Explore Your Courses',
      icon: BookOpen,
      accentFrom: '#10b981',
      accentTo: '#059669',
      hoverBg: 'rgba(16,185,129,0.05)',
      dotColor: '#10b981',
      tagBg: 'bg-emerald-100',
      tagText: 'text-emerald-700',
      iconBg: 'bg-emerald-50',
      iconBorder: 'border-emerald-200/60',
      iconColor: 'text-emerald-600',
      items: courses.slice(0, 3).map((c) => ({
        id: `c-${c.id}`,
        title: `Explore ${c.code}`,
        description:
          'Open this course to review materials, discussions, assignments, and study tools.',
        href: `/dashboard/courses/${c.id}`,
        tag: 'Course Focus',
      })),
    })
  }

  /* ---------- compute summary counts ---------- */

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0)

  /* ---------- render ---------- */

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* ===== HEADER ===== */}
      <header className="rec-header-animate relative overflow-hidden rounded-2xl p-8 sm:p-10 mb-10">
        {/* gradient background */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,247,237,0.9) 0%, rgba(254,242,242,0.5) 40%, rgba(239,246,255,0.4) 100%)',
          }}
        />

        {/* border overlay */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-200/50 pointer-events-none" />

        <div className="relative z-10">
          {/* icon + title */}
          <div className="flex items-center gap-3 mb-2">
            <svg className="rec-icon-glow h-8 w-8 shrink-0" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="rec-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L14.09 8.26L20.18 8.64L15.54 12.74L17.07 19.36L12 15.77L6.93 19.36L8.46 12.74L3.82 8.64L9.91 8.26L12 2Z"
                fill="url(#rec-star-grad)"
              />
            </svg>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Your Recommendations
            </h1>
          </div>

          <p className="text-slate-500 text-[15px] mt-1 max-w-lg">
            {totalItems > 0
              ? "Here's what needs your focus. We analyzed your courses, deadlines, and performance to surface what matters most."
              : 'Personalized suggestions will appear here based on your courses and activity.'}
          </p>

          {/* summary pills */}
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {sections.map((s) => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/60 shadow-sm"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.dotColor }}
                  />
                  {s.items.length} {s.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ===== EMPTY STATE ===== */}
      {sections.length === 0 && (
        <div className="text-center py-24">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 mb-6 shadow-sm">
            <Sparkles className="h-7 w-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {courses.length === 0 ? 'No courses yet' : 'Nothing urgent right now'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {courses.length === 0
              ? 'Enroll in courses first, then recommendations will appear here.'
              : 'You are caught up. Check back after new materials, assignments, or quiz activity.'}
          </p>
          {courses.length === 0 && (
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Browse courses <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* ===== SECTIONS ===== */}
      {sections.map((section, sIdx) => {
        const SectionIcon = section.icon

        return (
          <section key={section.key} className={sIdx > 0 ? 'mt-10' : ''}>
            {/* section header */}
            <div className="flex items-center gap-3 mb-1 px-1">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: section.dotColor }}
              />
              <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                {section.title}
              </h2>
              <span className="text-[12px] font-medium text-slate-300">
                {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-100 to-transparent" />
            </div>

            {/* items */}
            <div className="mt-3 rounded-xl border border-slate-100 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              {section.items.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rec-row-animate group relative flex items-center gap-4 px-5 py-4 transition-all duration-200"
                  style={{
                    animationDelay: `${sIdx * 100 + idx * 60}ms`,
                  }}
                >
                  {/* accent bar */}
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-50 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      background: `linear-gradient(to bottom, ${section.accentFrom}, ${section.accentTo})`,
                    }}
                  />

                  {/* hover background */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ backgroundColor: section.hoverBg }}
                  />

                  {/* icon */}
                  <div
                    className={`relative z-10 h-10 w-10 rounded-xl ${section.iconBg} border ${section.iconBorder} flex items-center justify-center ${section.iconColor} shrink-0 transition-transform duration-200 group-hover:scale-105`}
                  >
                    <SectionIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </div>

                  {/* content */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-[15px] leading-snug truncate">
                        {item.title}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${section.tagText} ${section.tagBg} px-2 py-0.5 rounded-md`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">
                      {item.description}
                    </p>
                  </div>

                  {/* arrow */}
                  <ChevronRight className="relative z-10 h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />

                  {/* bottom separator */}
                  {idx < section.items.length - 1 && (
                    <div className="absolute bottom-0 left-16 right-5 h-px bg-slate-100/80" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Lecturer Recommendations (unchanged — redesign later)              */
/* ------------------------------------------------------------------ */

async function LecturerRecommendations({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: courseData } = await supabase
    .from('courses')
    .select('id, code, title, level')
    .eq('lecturer_id', userId)
    .order('code', { ascending: true })

  const courses = (courseData || []) as Course[]
  const courseIds = courses.map((c) => c.id)

  let materials: Material[] = []
  let assignments: Assignment[] = []
  let discussions: DiscussionPost[] = []

  if (courseIds.length > 0) {
    const [matRes, asnRes, discRes] = await Promise.all([
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

    materials = (matRes.data || []) as Material[]
    assignments = (asnRes.data || []) as unknown as Assignment[]
    discussions = (discRes.data || []) as unknown as DiscussionPost[]
  }

  const assignmentIds = assignments.map((a) => a.id)
  let submissions: Submission[] = []
  if (assignmentIds.length > 0) {
    const { data } = await supabase
      .from('submissions')
      .select('id, assignment_id, grade, submitted_at')
      .in('assignment_id', assignmentIds)
    submissions = (data || []) as Submission[]
  }

  /* ---------- build feed sections ---------- */

  const sections: FeedSection[] = []

  // Ungraded submissions
  const ungradedItems: FeedItem[] = []
  assignments.forEach((a) => {
    const asnSubs = submissions.filter((s) => s.assignment_id === a.id)
    const ungraded = asnSubs.filter((s) => !s.grade)
    if (ungraded.length > 0) {
      ungradedItems.push({
        id: `grade-${a.id}`,
        title: `Grade ${ungraded.length} submission${ungraded.length === 1 ? '' : 's'}`,
        description: `${a.courses?.code || 'Course'}: ${a.title} has work waiting for review.`,
        href: `/dashboard/courses/${a.course_id}/assignments/${a.id}`,
        tag: 'Needs Grading',
      })
    }
  })
  if (ungradedItems.length > 0) {
    sections.push({
      key: 'grading',
      title: 'Needs Grading',
      icon: CheckCircle2,
      accentFrom: '#f43f5e',
      accentTo: '#e11d48',
      hoverBg: 'rgba(244,63,94,0.05)',
      dotColor: '#f43f5e',
      tagBg: 'bg-rose-100',
      tagText: 'text-rose-700',
      iconBg: 'bg-rose-50',
      iconBorder: 'border-rose-200/60',
      iconColor: 'text-rose-600',
      items: ungradedItems,
    })
  }

  // Content gaps
  const gapItems: FeedItem[] = []
  courses.forEach((c) => {
    const count = materials.filter((m) => m.course_id === c.id).length
    if (count < 2) {
      gapItems.push({
        id: `materials-${c.id}`,
        title: `Add more materials to ${c.code}`,
        description: 'This course has limited uploaded content. Add PDFs, slides, or notes so students and Campus AI have more context.',
        href: `/dashboard/courses/${c.id}?tab=materials`,
        tag: 'Content Gap',
      })
    }
  })
  if (gapItems.length > 0) {
    sections.push({
      key: 'gaps',
      title: 'Content Gaps',
      icon: FileText,
      accentFrom: '#f59e0b',
      accentTo: '#f97316',
      hoverBg: 'rgba(245,158,11,0.05)',
      dotColor: '#f59e0b',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-700',
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-200/60',
      iconColor: 'text-amber-600',
      items: gapItems,
    })
  }

  // Unanswered discussions
  if (discussions.length > 0) {
    sections.push({
      key: 'discussions',
      title: 'Unanswered Discussions',
      icon: MessageSquare,
      accentFrom: '#8b5cf6',
      accentTo: '#7c3aed',
      hoverBg: 'rgba(139,92,246,0.05)',
      dotColor: '#8b5cf6',
      tagBg: 'bg-violet-100',
      tagText: 'text-violet-700',
      iconBg: 'bg-violet-50',
      iconBorder: 'border-violet-200/60',
      iconColor: 'text-violet-600',
      items: discussions.map((p) => ({
        id: `discussion-${p.id}`,
        title: `Answer: ${p.title}`,
        description: `${p.courses?.code || 'Course'} has an unanswered discussion. Respond or mark the best reply as answered.`,
        href: `/dashboard/courses/${p.course_id}/discussions/${p.id}`,
        tag: 'Unanswered',
      })),
    })
  }

  // Fallback: course check-ins
  if (sections.length === 0 && courses.length > 0) {
    sections.push({
      key: 'check',
      title: 'Course Check-ins',
      icon: BookOpen,
      accentFrom: '#10b981',
      accentTo: '#059669',
      hoverBg: 'rgba(16,185,129,0.05)',
      dotColor: '#10b981',
      tagBg: 'bg-emerald-100',
      tagText: 'text-emerald-700',
      iconBg: 'bg-emerald-50',
      iconBorder: 'border-emerald-200/60',
      iconColor: 'text-emerald-600',
      items: courses.slice(0, 3).map((c) => ({
        id: `course-${c.id}`,
        title: `Review ${c.code}`,
        description: 'Open this course to check materials, assignments, classes, and student activity.',
        href: `/dashboard/courses/${c.id}`,
        tag: 'Course Check',
      })),
    })
  }

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0)

  /* ---------- render ---------- */

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* ===== HEADER ===== */}
      <header className="rec-header-animate relative overflow-hidden rounded-2xl p-8 sm:p-10 mb-10">
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,247,237,0.9) 0%, rgba(254,242,242,0.5) 40%, rgba(239,246,255,0.4) 100%)',
          }}
        />
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-200/50 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <svg className="rec-icon-glow h-8 w-8 shrink-0" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="rec-star-grad-lec" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L14.09 8.26L20.18 8.64L15.54 12.74L17.07 19.36L12 15.77L6.93 19.36L8.46 12.74L3.82 8.64L9.91 8.26L12 2Z"
                fill="url(#rec-star-grad-lec)"
              />
            </svg>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Your Recommendations
            </h1>
          </div>

          <p className="text-slate-500 text-[15px] mt-1 max-w-lg">
            {totalItems > 0
              ? 'Suggested actions to improve course coverage, grading, and student support.'
              : 'Teaching recommendations will appear here based on your courses and student activity.'}
          </p>

          {sections.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {sections.map((s) => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/60 shadow-sm"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.dotColor }}
                  />
                  {s.items.length} {s.title}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ===== EMPTY STATE ===== */}
      {sections.length === 0 && (
        <div className="text-center py-24">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 mb-6 shadow-sm">
            <Sparkles className="h-7 w-7 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {courses.length === 0 ? 'No courses yet' : 'All caught up'}
          </h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {courses.length === 0
              ? 'Create a course first, then teaching recommendations will appear here.'
              : 'No grading, material, or discussion issues need attention right now.'}
          </p>
          {courses.length === 0 && (
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Create a course <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* ===== SECTIONS ===== */}
      {sections.map((section, sIdx) => {
        const SectionIcon = section.icon
        return (
          <section key={section.key} className={sIdx > 0 ? 'mt-10' : ''}>
            <div className="flex items-center gap-3 mb-1 px-1">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: section.dotColor }}
              />
              <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                {section.title}
              </h2>
              <span className="text-[12px] font-medium text-slate-300">
                {section.items.length} {section.items.length === 1 ? 'item' : 'items'}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-100 to-transparent" />
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              {section.items.map((item, idx) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rec-row-animate group relative flex items-center gap-4 px-5 py-4 transition-all duration-200"
                  style={{ animationDelay: `${sIdx * 100 + idx * 60}ms` }}
                >
                  <div
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full opacity-50 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      background: `linear-gradient(to bottom, ${section.accentFrom}, ${section.accentTo})`,
                    }}
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{ backgroundColor: section.hoverBg }}
                  />
                  <div
                    className={`relative z-10 h-10 w-10 rounded-xl ${section.iconBg} border ${section.iconBorder} flex items-center justify-center ${section.iconColor} shrink-0 transition-transform duration-200 group-hover:scale-105`}
                  >
                    <SectionIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-slate-900 text-[15px] leading-snug truncate">
                        {item.title}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${section.tagText} ${section.tagBg} px-2 py-0.5 rounded-md`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="relative z-10 h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  {idx < section.items.length - 1 && (
                    <div className="absolute bottom-0 left-16 right-5 h-px bg-slate-100/80" />
                  )}
                </Link>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page Entry                                                         */
/* ------------------------------------------------------------------ */

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
