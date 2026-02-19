'use client'

import { useState } from 'react'
import { gradeSubmission } from '@/app/dashboard/courses/[courseId]/actions'
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
import { toast } from 'sonner'
import { CheckCircle } from 'lucide-react'

export function GradeSubmissionDialog({ 
  submission, 
  courseId, 
  assignmentId,
  studentName
}: { 
  submission: any, 
  courseId: string, 
  assignmentId: string,
  studentName: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await gradeSubmission(formData, submission.id, courseId, assignmentId)

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Grade assigned!')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={submission.grade ? "outline" : "default"} size="sm">
          {submission.grade ? <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> : null}
          {submission.grade ? 'Update Grade' : 'Grade'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>
            Assign a grade and optional feedback for {studentName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade / Score</Label>
            <Input 
              id="grade" 
              name="grade" 
              placeholder="e.g. 85/100, A, or 9/10" 
              defaultValue={submission.grade || ''}
              required 
              disabled={loading} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback (Optional)</Label>
            <Textarea 
              id="feedback" 
              name="feedback" 
              placeholder="Great job on the introduction, but check your sources..." 
              defaultValue={submission.feedback || ''}
              rows={4}
              disabled={loading} 
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}