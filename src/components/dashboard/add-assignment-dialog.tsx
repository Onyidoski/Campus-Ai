'use client'

import { useState, useRef } from 'react'
import { createAssignment } from '@/app/dashboard/courses/[courseId]/actions'
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
import { Progress } from '@/components/ui/progress' 
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

export function AddAssignmentDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0) 
  const intervalRef = useRef<NodeJS.Timeout | null>(null) 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setProgress(0)

    // Start fake progress animation for the upload
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(intervalRef.current!)
          return 95
        }
        return prev + 5
      })
    }, 300)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await createAssignment(formData, courseId)

      clearInterval(intervalRef.current!)
      setProgress(100) 

      setTimeout(() => {
        setLoading(false)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success('Assignment created!')
          setOpen(false)
          setProgress(0)
        }
      }, 500)
    } catch (error) {
      clearInterval(intervalRef.current!)
      setLoading(false)
      setProgress(0)
      console.error(error)
      toast.error("An unexpected error occurred.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (loading) return // Prevent closing while uploading
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Set a new task, deadline, and optional attachments for your students.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input id="title" name="title" placeholder="e.g., Chapter 1 Essay" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date & Time</Label>
            <Input id="dueDate" name="dueDate" type="datetime-local" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Attachment (Optional)</Label>
            <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" disabled={loading} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Instructions (Optional)</Label>
            <Textarea id="description" name="description" placeholder="Write a 500-word essay on..." rows={3} disabled={loading} />
          </div>

          {/* PROGRESS BAR */}
          {loading && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Saving...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Processing...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}