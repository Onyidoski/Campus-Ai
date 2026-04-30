'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createNotifications } from '@/lib/notifications'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { PDFParse } from 'pdf-parse'

type Course = {
  id: string
  code: string
  title: string
  level: string
}

type ParsedExamRow = {
  course_code?: string
  course_title?: string
  level?: string
  exam_date?: string
  start_time?: string
  duration_minutes?: number
  venue?: string
  notes?: string
}

export type ExamImportRow = ParsedExamRow & {
  row_id: string
  title: string
  matched_course_id: string | null
  matched_course_code: string | null
  matched_course_title: string | null
  status: 'matched' | 'unmatched' | 'incomplete'
}

function normalizeCourseCode(value?: string | null) {
  return (value || '').replace(/[^a-z0-9]/gi, '').toUpperCase()
}

function extractJsonArray(text: string) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  const candidate = fenceMatch?.[1] || text
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response did not contain a JSON array.')
  }

  return JSON.parse(candidate.slice(start, end + 1)) as ParsedExamRow[]
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', supabase: null, userId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: 'Admin access required', supabase: null, userId: null }
  }

  return { error: null, supabase, userId: user.id }
}

export async function parseExamTimetable(formData: FormData) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Please upload an exam timetable PDF.' }

  const fileName = file.name.toLowerCase()
  if (file.type !== 'application/pdf' && !fileName.endsWith('.pdf')) {
    return { error: 'Only PDF timetables are supported for import.' }
  }

  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, code, title, level')
    .order('code', { ascending: true })

  const courses = (coursesData || []) as Course[]
  if (courses.length === 0) return { error: 'Create courses before importing an exam timetable.' }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const textResult = await parser.getText()
    await parser.destroy()

    const extractedText = textResult.text?.trim()
    if (!extractedText) {
      return { error: 'No text could be extracted from this PDF. It may be scanned and need OCR.' }
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      system: `You extract university exam timetable rows from messy PDF text.

Return ONLY valid JSON. No markdown.

Output format:
[
  {
    "course_code": "CSC 301",
    "course_title": "Artificial Intelligence",
    "level": "300",
    "exam_date": "2026-05-12",
    "start_time": "09:00",
    "duration_minutes": 120,
    "venue": "Main Hall",
    "notes": ""
  }
]

Rules:
- Use ISO date format YYYY-MM-DD.
- Use 24-hour time HH:mm.
- If duration is missing, use 120.
- If level is missing but obvious from the course code/table section, infer it.
- If a field is unknown, use an empty string except duration_minutes.
- Do not invent courses that are not in the timetable text.`,
      prompt: `Known courses in this system:
${courses.map((course) => `- ${course.code}: ${course.title} (${course.level} level)`).join('\n')}

PDF TIMETABLE TEXT:
${extractedText.slice(0, 50_000)}`,
    })

    const parsedRows = extractJsonArray(text)
    const courseMap = new Map(courses.map((course) => [normalizeCourseCode(course.code), course]))

    const rows: ExamImportRow[] = parsedRows.map((row, index) => {
      const matchedCourse = courseMap.get(normalizeCourseCode(row.course_code))
      const hasRequiredFields = Boolean(matchedCourse && row.exam_date && row.start_time && row.venue)

      return {
        ...row,
        title: row.course_title || matchedCourse?.title || row.course_code || 'Exam',
        duration_minutes: Number(row.duration_minutes) || 120,
        row_id: `${index}-${normalizeCourseCode(row.course_code) || 'unknown'}`,
        matched_course_id: matchedCourse?.id || null,
        matched_course_code: matchedCourse?.code || null,
        matched_course_title: matchedCourse?.title || null,
        level: row.level || matchedCourse?.level || '',
        status: matchedCourse ? (hasRequiredFields ? 'matched' : 'incomplete') : 'unmatched',
      }
    })

    return { rows, courses }
  } catch (error) {
    console.error('Exam timetable parse error:', error)
    return { error: 'Could not parse the timetable PDF. Please try a clearer digital PDF.' }
  }
}

export async function confirmExamImport(rowsJson: string) {
  const { error: authError, supabase, userId } = await requireAdmin()
  if (authError || !supabase || !userId) return { error: authError }

  let rows: ExamImportRow[] = []
  try {
    rows = JSON.parse(rowsJson) as ExamImportRow[]
  } catch {
    return { error: 'Invalid import data.' }
  }

  const validRows = rows.filter((row) =>
    row.matched_course_id &&
    row.title &&
    row.exam_date &&
    row.start_time &&
    row.venue
  )

  if (validRows.length === 0) {
    return { error: 'No valid matched exam rows to import.' }
  }

  const examsToInsert = validRows.map((row) => ({
    course_id: row.matched_course_id,
    level: row.level || 'unknown',
    title: row.title,
    exam_date: new Date(`${row.exam_date}T${row.start_time}`).toISOString(),
    duration_minutes: Number(row.duration_minutes) || 120,
    venue: row.venue,
    notes: row.notes || null,
    created_by: userId,
  }))

  const { data: insertedExams, error } = await supabase
    .from('exams')
    .insert(examsToInsert)
    .select('id, course_id, level, title, exam_date, venue')

  if (error) return { error: error.message }

  for (const exam of insertedExams || []) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('course_id', exam.course_id)

    await createNotifications(
      supabase,
      (enrollments || []).map((enrollment) => ({
        user_id: enrollment.student_id,
        type: 'exam',
        title: `Exam scheduled: ${exam.title}`,
        message: `${exam.title} is scheduled for ${new Date(exam.exam_date).toLocaleString()} at ${exam.venue}.`,
        href: '/dashboard/exams',
      }))
    )
  }

  revalidatePath('/dashboard/admin/exams')
  revalidatePath('/dashboard/exams')
  revalidatePath('/dashboard/notifications')
  return { success: `${validRows.length} exam${validRows.length === 1 ? '' : 's'} imported.` }
}

export async function createManualExam(formData: FormData) {
  const { error: authError, supabase, userId } = await requireAdmin()
  if (authError || !supabase || !userId) return { error: authError }

  const courseId = formData.get('courseId') as string
  const title = formData.get('title') as string
  const level = formData.get('level') as string
  const examDate = formData.get('examDate') as string
  const startTime = formData.get('startTime') as string
  const duration = Number(formData.get('duration') as string) || 120
  const venue = formData.get('venue') as string
  const notes = formData.get('notes') as string

  if (!courseId || !title || !level || !examDate || !startTime || !venue) {
    return { error: 'Course, title, level, date, time, and venue are required.' }
  }

  const { data: exam, error } = await supabase
    .from('exams')
    .insert({
      course_id: courseId,
      title,
      level,
      exam_date: new Date(`${examDate}T${startTime}`).toISOString(),
      duration_minutes: duration,
      venue,
      notes: notes || null,
      created_by: userId,
    })
    .select('id, course_id, title, exam_date, venue')
    .single()

  if (error) return { error: error.message }

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('course_id', courseId)

  await createNotifications(
    supabase,
    (enrollments || []).map((enrollment) => ({
      user_id: enrollment.student_id,
      type: 'exam',
      title: `Exam scheduled: ${exam.title}`,
      message: `${exam.title} is scheduled for ${new Date(exam.exam_date).toLocaleString()} at ${exam.venue}.`,
      href: '/dashboard/exams',
    }))
  )

  revalidatePath('/dashboard/admin/exams')
  revalidatePath('/dashboard/exams')
  revalidatePath('/dashboard/notifications')
  return { success: 'Exam scheduled successfully.' }
}

export async function deleteExam(examId: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/exams')
  revalidatePath('/dashboard/exams')
  return { success: 'Exam deleted.' }
}

export async function deleteExamFromForm(examId: string) {
  await deleteExam(examId)
}
