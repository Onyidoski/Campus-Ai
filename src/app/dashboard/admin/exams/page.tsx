import { redirect } from 'next/navigation'
import { CalendarDays, MapPin, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExamTimetableImporter } from '@/components/dashboard/admin/exam-timetable-importer'
import { ManualExamDialog } from '@/components/dashboard/admin/manual-exam-dialog'
import { deleteExamFromForm } from './actions'

type Exam = {
  id: string
  title: string
  level: string
  exam_date: string
  duration_minutes?: number | null
  venue: string
  courses?: {
    id?: string | null
    code?: string | null
    title?: string | null
  } | null
}

export default async function AdminExamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data } = await supabase
    .from('exams')
    .select('id, title, level, exam_date, duration_minutes, venue, courses(code, title)')
    .order('exam_date', { ascending: true })
    .limit(100)

  const exams = (data || []) as unknown as Exam[]

  const { data: coursesData } = await supabase
    .from('courses')
    .select('id, code, title, level')
    .order('code', { ascending: true })

  const courses = (coursesData || []) as { id: string; code: string; title: string; level: string }[]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarDays className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Exam Timetable</h1>
          </div>
          <p className="text-muted-foreground">
            Import university exam timetable PDFs and review scheduled exams.
          </p>
        </div>
        <ManualExamDialog courses={courses} />
      </div>

      <ExamTimetableImporter />

      <Card>
        <CardContent className="p-0">
          {exams.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              <CalendarDays className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <p>No exams imported yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {exams.map((exam) => {
                const date = new Date(exam.exam_date)

                return (
                  <div key={exam.id} className="grid gap-3 p-4 md:grid-cols-12 md:items-center">
                    <div className="md:col-span-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">{exam.courses?.code || 'Course'}</Badge>
                        <Badge variant="secondary">{exam.level} Level</Badge>
                      </div>
                      <h2 className="font-semibold text-gray-900">{exam.title}</h2>
                    </div>
                    <div className="md:col-span-3 text-sm text-gray-600">
                      <p>{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {exam.duration_minutes || 120} mins
                      </p>
                    </div>
                    <div className="md:col-span-3 flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {exam.venue}
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <form action={deleteExamFromForm.bind(null, exam.id)}>
                        <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
