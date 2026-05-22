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
        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all duration-200 shadow-sm rounded-xl h-9.5 px-4 flex items-center gap-2 border border-slate-950/20">
          <Plus className="h-4 w-4" /> Create Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] rounded-2xl border border-slate-100/80 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">Create New Course</DialogTitle>
          <DialogDescription className="text-xs text-slate-450">
            Create a course and optionally assign a lecturer immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Course Code</Label>
              <Input id="code" name="code" placeholder="e.g. CSC 301" required disabled={loading} className="rounded-xl border-slate-200/80 focus-visible:ring-indigo-650/20 focus-visible:border-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Level</Label>
              <Select name="level" defaultValue="100">
                <SelectTrigger className="rounded-xl border-slate-200/80 focus:ring-indigo-650/20">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-md">
                  <SelectItem value="100">100 Level</SelectItem>
                  <SelectItem value="200">200 Level</SelectItem>
                  <SelectItem value="300">300 Level</SelectItem>
                  <SelectItem value="400">400 Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Course Title</Label>
            <Input id="title" name="title" placeholder="e.g. Data Structures and Algorithms" required disabled={loading} className="rounded-xl border-slate-200/80 focus-visible:ring-indigo-650/20 focus-visible:border-indigo-500" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="Brief description of the course..." rows={3} disabled={loading} className="rounded-xl border-slate-200/80 focus-visible:ring-indigo-650/20 focus-visible:border-indigo-500" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Assign Lecturer (optional)</Label>
            <Select name="lecturerId" defaultValue="unassigned">
              <SelectTrigger className="rounded-xl border-slate-200/80 focus:ring-indigo-650/20">
                <SelectValue placeholder="Select a lecturer" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-md">
                <SelectItem value="unassigned">— No lecturer (assign later)</SelectItem>
                {lecturers.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.full_name} {l.department ? `(${l.department})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl px-5 h-9.5">
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
