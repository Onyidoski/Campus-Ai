'use client'

import { useState } from 'react'
import { createAnnouncement } from '@/app/dashboard/courses/[courseId]/actions'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Megaphone, AlertCircle } from 'lucide-react'

export function AddAnnouncementDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createAnnouncement(formData, courseId)

    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full rounded-xl sm:w-auto">
          <Megaphone className="mr-2 h-4 w-4" /> Post announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Post to Class Stream</DialogTitle>
          <DialogDescription>
            Share updates, changes, or important information with your students.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea 
              id="content" 
              name="content" 
              placeholder="Type your announcement here..." 
              required
              rows={5}
              disabled={loading} 
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 transition-colors hover:border-rose-200 hover:bg-rose-50/50 has-[:checked]:border-rose-200 has-[:checked]:bg-rose-50/60">
            <input
              type="checkbox"
              name="isUrgent"
              className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <AlertCircle className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Mark as urgent</span>
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Posting...' : 'Post Announcement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}