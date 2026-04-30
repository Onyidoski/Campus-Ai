'use client'

import { useState } from 'react'
import { createCampusAnnouncement } from '@/app/dashboard/admin/actions'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Megaphone, AlertCircle } from 'lucide-react'

export function CampusAnnouncementDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createCampusAnnouncement(formData)

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
        <Button className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 shadow-md shadow-red-200/40">
          <Megaphone className="mr-2 h-4 w-4" /> Campus Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-red-600" />
            </div>
            Post Campus Announcement
          </DialogTitle>
          <DialogDescription>
            This announcement will be visible to all users on the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              name="content"
              placeholder="Type your campus-wide announcement here..."
              required
              rows={5}
              disabled={loading}
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select name="targetLevel" defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌐 All Users (Campus-Wide)</SelectItem>
                <SelectItem value="100">🎓 100 Level Students Only</SelectItem>
                <SelectItem value="200">🎓 200 Level Students Only</SelectItem>
                <SelectItem value="300">🎓 300 Level Students Only</SelectItem>
                <SelectItem value="400">🎓 400 Level Students Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgent Toggle */}
          <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors border-red-100 bg-red-50/50">
            <input
              type="checkbox"
              name="isUrgent"
              className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600"
            />
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Mark as Urgent</span>
          </label>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-500">
              {loading ? 'Posting...' : 'Post Announcement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
