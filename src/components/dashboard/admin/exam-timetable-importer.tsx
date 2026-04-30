'use client'

import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, FileUp, Loader2, Wand2 } from 'lucide-react'
import { parseExamTimetable, confirmExamImport, type ExamImportRow } from '@/app/dashboard/admin/exams/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Course = {
  id: string
  code: string
  title: string
  level: string
}

function updateRow(rows: ExamImportRow[], rowId: string, patch: Partial<ExamImportRow>) {
  return rows.map((row) => {
    if (row.row_id !== rowId) return row

    const next = { ...row, ...patch }
    const isReady = Boolean(next.matched_course_id && next.title && next.exam_date && next.start_time && next.venue)
    next.status = next.matched_course_id ? (isReady ? 'matched' : 'incomplete') : 'unmatched'
    return next
  })
}

export function ExamTimetableImporter() {
  const [rows, setRows] = useState<ExamImportRow[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const importableRows = useMemo(
    () => rows.filter((row) => row.status === 'matched' && row.matched_course_id),
    [rows]
  )

  const handleParse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsParsing(true)

    const formData = new FormData(event.currentTarget)
    const result = await parseExamTimetable(formData)

    setIsParsing(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    setRows(result.rows || [])
    setCourses(result.courses || [])
    toast.success(`Parsed ${result.rows?.length || 0} timetable row${result.rows?.length === 1 ? '' : 's'}.`)
  }

  const handleCourseChange = (row: ExamImportRow, courseId: string) => {
    const course = courses.find((item) => item.id === courseId)
    setRows((current) => updateRow(current, row.row_id, {
      matched_course_id: course?.id || null,
      matched_course_code: course?.code || null,
      matched_course_title: course?.title || null,
      course_code: course?.code || row.course_code,
      title: course?.title || row.title,
      level: course?.level || row.level,
    }))
  }

  const handleConfirm = async () => {
    setIsImporting(true)
    const result = await confirmExamImport(JSON.stringify(rows))
    setIsImporting(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success(result.success)
    setRows([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileUp className="h-4 w-4 text-blue-600" />
          Import Exam Timetable PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleParse} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input name="file" type="file" accept="application/pdf,.pdf" required disabled={isParsing} />
          <Button type="submit" disabled={isParsing} className="sm:shrink-0">
            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Parse PDF
          </Button>
        </form>

        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Review extracted exams</p>
                <p className="text-xs text-muted-foreground">
                  Import only matched rows. Fix unmatched rows by selecting a course.
                </p>
              </div>
              <Button onClick={handleConfirm} disabled={isImporting || importableRows.length === 0}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Import {importableRows.length}
              </Button>
            </div>

            <div className="divide-y rounded-xl border bg-white overflow-hidden">
              {rows.map((row) => (
                <div key={row.row_id} className="grid gap-3 p-4 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-3">
                    <Select value={row.matched_course_id || ''} onValueChange={(value) => handleCourseChange(row, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={row.course_code || 'Match course'} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className={`text-[10px] ${
                        row.status === 'matched'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : row.status === 'incomplete'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {row.status}
                      </Badge>
                      {!row.matched_course_id && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <Input
                      value={row.title || ''}
                      onChange={(event) => setRows((current) => updateRow(current, row.row_id, { title: event.target.value }))}
                      placeholder="Course / exam title"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <Input
                      type="date"
                      value={row.exam_date || ''}
                      onChange={(event) => setRows((current) => updateRow(current, row.row_id, { exam_date: event.target.value }))}
                    />
                    <Input
                      type="time"
                      value={row.start_time || ''}
                      onChange={(event) => setRows((current) => updateRow(current, row.row_id, { start_time: event.target.value }))}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <Input
                      value={row.venue || ''}
                      onChange={(event) => setRows((current) => updateRow(current, row.row_id, { venue: event.target.value }))}
                      placeholder="Venue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                    <Input
                      value={row.level || ''}
                      onChange={(event) => setRows((current) => updateRow(current, row.row_id, { level: event.target.value }))}
                      placeholder="Level"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={row.duration_minutes || 120}
                      onChange={(event) => setRows((current) => updateRow(current, row.row_id, { duration_minutes: Number(event.target.value) }))}
                      placeholder="Mins"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
