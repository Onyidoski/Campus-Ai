'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarPlus } from 'lucide-react'
import { createManualExam } from '@/app/dashboard/admin/exams/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Course = {
  id: string
  code: string
  title: string
  level: string
}

export function ManualExamDialog({ courses }: { courses: Course[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '')

  const selectedCourse = courses.find((course) => course.id === selectedCourseId)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await createManualExam(formData)

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
      return
    }

    toast.success(result.success)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Exam Manually</DialogTitle>
          <DialogDescription>
            Schedule a single university exam when you do not want to import a PDF timetable.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select name="courseId" value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <input type="hidden" name="level" value={selectedCourse?.level || ''} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Exam Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={selectedCourse?.title || ''}
                placeholder="e.g. Artificial Intelligence"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input value={selectedCourse?.level ? `${selectedCourse.level} Level` : ''} readOnly />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="examDate">Date</Label>
              <Input id="examDate" name="examDate" type="date" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Time</Label>
              <Input id="startTime" name="startTime" type="time" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Minutes</Label>
              <Input id="duration" name="duration" type="number" min="1" defaultValue="120" required disabled={loading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" name="venue" placeholder="e.g. Main Auditorium" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} placeholder="Optional instructions..." disabled={loading} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || courses.length === 0}>
              {loading ? 'Adding...' : 'Add Exam'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
