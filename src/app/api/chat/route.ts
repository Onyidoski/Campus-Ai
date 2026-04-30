import { createClient } from '@/utils/supabase/server'
import { streamText, embed, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { NextResponse } from 'next/server'

// Allow responses up to 30 seconds
export const maxDuration = 30

type TextPart = {
    type: 'text'
    text: string
}

type ChatRequest = {
    messages: UIMessage[]
    courseId?: string
    materialId?: string
}

type Course = {
    id: string
    code: string
    title: string
    level?: string | null
}

type EnrollmentRow = {
    courses: Course | Course[] | null
}

type Assignment = {
    title: string
    description?: string | null
    due_date?: string | null
    courses?: Pick<Course, 'code' | 'title'> | null
}

type OnlineClass = {
    title: string
    scheduled_at?: string | null
    duration_minutes?: number | null
    status?: string | null
    courses?: Pick<Course, 'code' | 'title'> | null
}

type CampusAnnouncement = {
    content: string
    is_urgent?: boolean | null
    target_level?: string | null
    created_at?: string | null
}

type CourseAnnouncement = {
    content: string
    is_urgent?: boolean | null
    created_at?: string | null
    courses?: Pick<Course, 'code' | 'title'> | null
}

type UserNotification = {
    type: string
    title: string
    message: string
    href?: string | null
    created_at?: string | null
}

type ExamContextRow = {
    title: string
    level?: string | null
    exam_date?: string | null
    duration_minutes?: number | null
    venue?: string | null
    notes?: string | null
    courses?: Pick<Course, 'code' | 'title'> | null
}

type GradeSummaryRow = {
    grade?: string | null
    feedback?: string | null
    submitted_at?: string | null
    assignments?: {
        title?: string | null
        due_date?: string | null
        courses?: Pick<Course, 'code' | 'title'> | null
    } | null
    profiles?: {
        full_name?: string | null
    } | null
}

type ContentChunk = {
    content: string
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return 'No date set'

    return new Date(value).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function buildList<T>(items: T[], render: (item: T) => string, emptyText: string) {
    if (items.length === 0) return emptyText
    return items.map(render).join('\n')
}

function normalizeJoinedCourse(courses: EnrollmentRow['courses']) {
    return Array.isArray(courses) ? courses[0] : courses
}

export async function POST(req: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as ChatRequest
    const { messages, courseId, materialId } = body

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role, academic_level, department')
        .eq('id', user.id)
        .single()

    const lastMessage = messages[messages.length - 1]
    const latestMessage = lastMessage.parts
        ?.filter((p): p is TextPart => p.type === 'text')
        .map((p) => p.text)
        .join('') || ''

    const isLecturer = profile?.role === 'lecturer'

    let userCourses: Course[] = []
    if (isLecturer) {
        const { data } = await supabase
            .from('courses')
            .select('id, code, title, level')
            .eq('lecturer_id', user.id)
            .order('code', { ascending: true })

        userCourses = (data || []) as Course[]
    } else {
        const { data } = await supabase
            .from('enrollments')
            .select('courses(id, code, title, level)')
            .eq('student_id', user.id)

        userCourses = ((data || []) as unknown as EnrollmentRow[])
            .map((enrollment) => normalizeJoinedCourse(enrollment.courses))
            .filter((course): course is Course => Boolean(course))
    }

    const userCourseIds = userCourses.map((course) => course.id)
    const selectedCourse = userCourses.find((course) => course.id === courseId)

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const [
        upcomingAssignmentsResult,
        todayClassesResult,
        weekClassesResult,
        campusAnnouncementsResult,
        courseAnnouncementsResult,
        notificationsResult,
        gradeSummaryResult,
        examsResult,
    ] = await Promise.all([
        userCourseIds.length > 0
            ? supabase
                .from('assignments')
                .select('id, title, description, due_date, course_id, courses(code, title)')
                .in('course_id', userCourseIds)
                .gte('due_date', now.toISOString())
                .lte('due_date', weekEnd.toISOString())
                .order('due_date', { ascending: true })
                .limit(8)
            : Promise.resolve({ data: [] as Assignment[] }),
        userCourseIds.length > 0
            ? supabase
                .from('online_classes')
                .select('id, title, scheduled_at, duration_minutes, status, course_id, courses(code, title)')
                .in('course_id', userCourseIds)
                .gte('scheduled_at', todayStart.toISOString())
                .lt('scheduled_at', todayEnd.toISOString())
                .order('scheduled_at', { ascending: true })
                .limit(8)
            : Promise.resolve({ data: [] as OnlineClass[] }),
        userCourseIds.length > 0
            ? supabase
                .from('online_classes')
                .select('id, title, scheduled_at, duration_minutes, status, course_id, courses(code, title)')
                .in('course_id', userCourseIds)
                .gte('scheduled_at', now.toISOString())
                .lte('scheduled_at', weekEnd.toISOString())
                .order('scheduled_at', { ascending: true })
                .limit(10)
            : Promise.resolve({ data: [] as OnlineClass[] }),
        profile?.academic_level
            ? supabase
                .from('campus_announcements')
                .select('content, is_urgent, target_level, created_at, profiles:admin_id(full_name)')
                .or(`target_level.is.null,target_level.eq.${profile.academic_level}`)
                .order('created_at', { ascending: false })
                .limit(5)
            : supabase
                .from('campus_announcements')
                .select('content, is_urgent, target_level, created_at, profiles:admin_id(full_name)')
                .is('target_level', null)
                .order('created_at', { ascending: false })
                .limit(5),
        userCourseIds.length > 0
            ? supabase
                .from('announcements')
                .select('content, is_urgent, created_at, course_id, courses(code, title), profiles:lecturer_id(full_name)')
                .in('course_id', userCourseIds)
                .order('created_at', { ascending: false })
                .limit(5)
            : Promise.resolve({ data: [] as CourseAnnouncement[] }),
        supabase
            .from('notifications')
            .select('type, title, message, href, created_at')
            .eq('user_id', user.id)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(8),
        isLecturer && userCourseIds.length > 0
            ? supabase
                .from('submissions')
                .select('grade, feedback, submitted_at, assignments(title, due_date, courses(code, title)), profiles:student_id(full_name)')
                .order('submitted_at', { ascending: false })
                .limit(8)
            : supabase
                .from('submissions')
                .select('grade, feedback, submitted_at, assignments(title, due_date, courses(code, title))')
                .eq('student_id', user.id)
                .order('submitted_at', { ascending: false })
                .limit(8),
        userCourseIds.length > 0
            ? supabase
                .from('exams')
                .select('title, level, exam_date, duration_minutes, venue, notes, courses(code, title)')
                .in('course_id', userCourseIds)
                .gte('exam_date', now.toISOString())
                .order('exam_date', { ascending: true })
                .limit(8)
            : Promise.resolve({ data: [] as ExamContextRow[] }),
    ])

    const upcomingAssignments = (upcomingAssignmentsResult.data || []) as Assignment[]
    const todayClasses = (todayClassesResult.data || []) as OnlineClass[]
    const weekClasses = (weekClassesResult.data || []) as OnlineClass[]
    const campusAnnouncements = (campusAnnouncementsResult.data || []) as CampusAnnouncement[]
    const courseAnnouncements = (courseAnnouncementsResult.data || []) as CourseAnnouncement[]
    const unreadNotifications = (notificationsResult.data || []) as UserNotification[]
    const gradeSummary = (gradeSummaryResult.data || []) as unknown as GradeSummaryRow[]
    const upcomingExams = (examsResult.data || []) as unknown as ExamContextRow[]

    const campusContext = `CURRENT USER:
- Name: ${profile?.full_name || 'Unknown'}
- Role: ${profile?.role || 'Unknown'}
- Academic level: ${profile?.academic_level || 'N/A'}
- Department: ${profile?.department || 'N/A'}
- Current date/time: ${now.toLocaleString('en-US')}

SELECTED COURSE:
${selectedCourse ? `- ${selectedCourse.code}: ${selectedCourse.title} (${selectedCourse.level || 'unknown'} level)` : '- No selected course, or selected course is not available to this user.'}

USER COURSES:
${buildList(userCourses, (course) => `- ${course.code}: ${course.title} (${course.level || 'unknown'} level)`, '- No courses found.')}

ASSIGNMENTS DUE IN THE NEXT 7 DAYS:
${buildList(upcomingAssignments, (assignment) => `- ${assignment.courses?.code || 'Course'}: ${assignment.title}, due ${formatDateTime(assignment.due_date)}${assignment.description ? `. Notes: ${assignment.description}` : ''}`, '- No upcoming assignments found.')}

CLASSES TODAY:
${buildList(todayClasses, (cls) => `- ${cls.courses?.code || 'Course'}: ${cls.title}, ${formatDateTime(cls.scheduled_at)}, ${cls.duration_minutes || 'unknown'} minutes, status: ${cls.status || 'scheduled'}`, '- No classes scheduled today.')}

CLASSES IN THE NEXT 7 DAYS:
${buildList(weekClasses, (cls) => `- ${cls.courses?.code || 'Course'}: ${cls.title}, ${formatDateTime(cls.scheduled_at)}, ${cls.duration_minutes || 'unknown'} minutes, status: ${cls.status || 'scheduled'}`, '- No upcoming classes found.')}

CAMPUS ANNOUNCEMENTS:
${buildList(campusAnnouncements, (announcement) => `- ${announcement.is_urgent ? 'URGENT: ' : ''}${announcement.content} (${formatDateTime(announcement.created_at)}${announcement.target_level ? `, ${announcement.target_level} level` : ', campus-wide'})`, '- No recent campus announcements found.')}

COURSE ANNOUNCEMENTS:
${buildList(courseAnnouncements, (announcement) => `- ${announcement.is_urgent ? 'URGENT: ' : ''}${announcement.courses?.code || 'Course'}: ${announcement.content} (${formatDateTime(announcement.created_at)})`, '- No recent course announcements found.')}

UNREAD NOTIFICATIONS:
${buildList(unreadNotifications, (notification) => `- ${notification.title}: ${notification.message} (${formatDateTime(notification.created_at)})`, '- No unread notifications found.')}

RECENT GRADE ACTIVITY:
${buildList(gradeSummary, (item) => {
        const assignment = item.assignments
        const courseCode = assignment?.courses?.code || 'Course'
        const studentName = item.profiles?.full_name ? `${item.profiles.full_name}: ` : ''
        return `- ${studentName}${courseCode} ${assignment?.title || 'Assignment'}: ${item.grade ? `graded ${item.grade}` : 'submitted, not graded yet'}${item.feedback ? `. Feedback: ${item.feedback}` : ''}`
    }, '- No recent grade activity found.')}

UPCOMING EXAMS:
${buildList(upcomingExams, (exam) => `- ${exam.courses?.code || 'Course'} ${exam.title}: ${formatDateTime(exam.exam_date)}, venue: ${exam.venue || 'TBA'}, duration: ${exam.duration_minutes || 120} minutes${exam.notes ? `. Notes: ${exam.notes}` : ''}`, '- No upcoming exams found.')}`

    let contextText = ''

    if (materialId) {
        const { data: chunks, error: chunkError } = await supabase
            .from('material_embeddings')
            .select('content')
            .eq('material_id', materialId)
            .limit(20)

        if (chunkError) console.error('Material fetch error:', chunkError)

        if (chunks && chunks.length > 0) {
            contextText = (chunks as ContentChunk[]).map((chunk) => chunk.content).join('\n\n---\n\n')
        }
    } else if (courseId) {
        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: latestMessage,
        })

        const { data: matchedContext, error } = await supabase.rpc('match_material_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.3,
            match_count: 5,
            filter_course_id: courseId,
        })

        if (error) console.error('Vector Search Error:', error)

        if (matchedContext && matchedContext.length > 0) {
            contextText = (matchedContext as ContentChunk[]).map((match) => match.content).join('\n\n---\n\n')
        }
    }

    const systemPrompt = `You are a helpful, encouraging, and brilliant university teaching assistant named Campus AI.
You are currently helping a campus user with coursework, classes, assignments, announcements, and study questions.

Below is live LMS context for this user. Use it to answer questions about courses, assignments, timetable/classes, announcements, and reminders.

LIVE CAMPUS CONTEXT:
${campusContext}

Below is context extracted from the lecturer's uploaded course materials. Use it when the user asks academic/course-content questions.

COURSE MATERIALS CONTEXT:
${contextText || 'No specific course materials found for this question.'}

RULES:
1. For schedule, assignment, course, and announcement questions, answer from the LIVE CAMPUS CONTEXT first.
2. For academic/course-content questions, use COURSE MATERIALS CONTEXT first.
3. If the course materials do not contain the academic answer, say that clearly, then provide a helpful general explanation.
4. Do not invent assignments, classes, courses, grades, exams, or announcements that are not in the live context.
5. Format your answers beautifully using markdown to make it easy for a student to read.`

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
}
