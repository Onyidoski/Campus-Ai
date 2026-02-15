'use client'

import { useState } from 'react'
import { editAssignment } from '@/app/dashboard/courses/[courseId]/actions'
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
import { Pencil } from 'lucide-react'

// We pass the existing assignment data into this component
export function EditAssignmentDialog({ assignment, courseId }: { assignment: any, courseId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Format the UTC date from the DB into the YYYY-MM-DDTHH:mm format required by the input
  const dateObj = new Date(assignment.due_date)
  const formattedDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await editAssignment(formData, assignment.id, courseId)

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Assignment updated!')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Edit Assignment">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the details or deadline for this assignment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title</Label>
            <Input id="title" name="title" defaultValue={assignment.title} required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date & Time</Label>
            <Input id="dueDate" name="dueDate" type="datetime-local" defaultValue={formattedDate} required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Replace Attachment (Optional)</Label>
            <Input id="file" name="file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" disabled={loading} />
            {assignment.attachment_url && (
              <p className="text-xs text-muted-foreground mt-1">Leave empty to keep the existing attachment.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Instructions (Optional)</Label>
            <Textarea id="description" name="description" defaultValue={assignment.description} rows={3} disabled={loading} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}