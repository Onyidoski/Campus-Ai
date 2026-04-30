'use client'

import { useState } from 'react'
import { adminCreateCourse } from '@/app/dashboard/admin/actions'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface Lecturer {
  id: string
  full_name: string
  email: string
  department: string | null
}

export function AdminCreateCourseDialog({ lecturers }: { lecturers: Lecturer[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await adminCreateCourse(formData)

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
        <Button className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md shadow-emerald-200/40">
          <Plus className="mr-2 h-4 w-4" /> Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Create a course and optionally assign a lecturer immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" name="code" placeholder="e.g. CSC 301" required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select name="level" defaultValue="100">
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input id="title" name="title" placeholder="e.g. Data Structures and Algorithms" required disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="Brief description of the course..." rows={3} disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label>Assign Lecturer (optional)</Label>
            <Select name="lecturerId" defaultValue="unassigned">
              <SelectTrigger>
                <SelectValue placeholder="Select a lecturer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">— No lecturer (assign later)</SelectItem>
                {lecturers.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.full_name} {l.department ? `(${l.department})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500">
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
