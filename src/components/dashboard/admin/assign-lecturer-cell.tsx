'use client'

import { useState } from 'react'
import { assignLecturerToCourse } from '@/app/dashboard/admin/actions'
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
import { toast } from 'sonner'
import { UserCheck, Check } from 'lucide-react'

interface Lecturer {
  id: string
  full_name: string
  email: string
  department: string | null
}

interface AssignLecturerCellProps {
  courseId: string
  courseCode: string
  currentLecturerId: string | null
  lecturers: Lecturer[]
}

export function AssignLecturerCell({ courseId, courseCode, currentLecturerId, lecturers }: AssignLecturerCellProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filteredLecturers = lecturers.filter(l =>
    l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.department?.toLowerCase().includes(search.toLowerCase())
  )

  const handleAssign = async (lecturerId: string) => {
    if (lecturerId === currentLecturerId) return
    setLoading(true)

    const result = await assignLecturerToCourse(courseId, lecturerId)

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
        <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
          <UserCheck className="h-3 w-3" />
          {currentLecturerId ? 'Reassign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-violet-600" />
            </div>
            Assign Lecturer to {courseCode}
          </DialogTitle>
          <DialogDescription>
            Select a lecturer to assign to this course. They will have full management access.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lecturers by name, email, or department..."
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400
            transition-all duration-200"
        />

        {/* Lecturer List */}
        <div className="max-h-[300px] overflow-y-auto border rounded-lg divide-y divide-gray-100">
          {filteredLecturers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="mx-auto h-6 w-6 mb-2 opacity-20" />
              <p className="text-sm">No lecturers found.</p>
            </div>
          ) : (
            filteredLecturers.map((lecturer) => {
              const isCurrentlyAssigned = lecturer.id === currentLecturerId
              const initial = lecturer.full_name?.charAt(0).toUpperCase() || '?'

              return (
                <button
                  key={lecturer.id}
                  onClick={() => handleAssign(lecturer.id)}
                  disabled={loading || isCurrentlyAssigned}
                  className={`w-full flex items-center gap-3 p-3 text-left transition-colors
                    ${isCurrentlyAssigned
                      ? 'bg-violet-50/50 cursor-default'
                      : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{lecturer.full_name}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {lecturer.email}
                      {lecturer.department && ` • ${lecturer.department}`}
                    </p>
                  </div>
                  {isCurrentlyAssigned && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Check className="h-4 w-4 text-violet-600" />
                      <span className="text-[10px] text-violet-600 font-medium">Current</span>
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
