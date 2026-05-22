'use client'

import { useState } from 'react'
import { assignLecturerToCourse } from '@/app/dashboard/admin/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7.5 px-3 rounded-lg border-slate-200 hover:border-slate-300 text-slate-700 font-semibold gap-1.5 transition-all duration-200 bg-white hover:bg-slate-50/50 shadow-2xs hover:shadow-xs shrink-0 select-none"
        >
          <UserCheck className="h-3.5 w-3.5 text-slate-500" />
          {currentLecturerId ? 'Reassign' : 'Assign'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-100/80 shadow-lg p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-800">
            <div className="h-8.5 w-8.5 rounded-lg bg-indigo-50 border border-indigo-100/40 flex items-center justify-center">
              <UserCheck className="h-4.5 w-4.5 text-indigo-655" />
            </div>
            <span>Assign Lecturer to {courseCode}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-450 pl-11">
            Select a lecturer to assign to this course. They will have full management access.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lecturers by name, email, or department..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-medium text-slate-700
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400
            transition-all duration-200 shadow-xs"
        />

        {/* Lecturer List */}
        <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-slate-50/20 shadow-2xs">
          {filteredLecturers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <UserCheck className="mx-auto h-6 w-6 mb-2 opacity-20" />
              <p className="text-xs font-medium">No lecturers found.</p>
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
                      ? 'bg-indigo-50/40 cursor-default'
                      : 'hover:bg-white bg-transparent cursor-pointer'
                    }`}
                >
                  <div className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 border ${
                    isCurrentlyAssigned
                      ? 'bg-indigo-100/70 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border border-slate-100 text-slate-700'
                  }`}>
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{lecturer.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {lecturer.email}
                      {lecturer.department && ` • ${lecturer.department}`}
                    </p>
                  </div>
                  {isCurrentlyAssigned && (
                    <div className="flex items-center gap-1 shrink-0 bg-indigo-50 border border-indigo-100 text-indigo-750 text-[10px] font-bold px-2 py-0.5 rounded-full select-none leading-none">
                      <Check className="h-3 w-3 text-indigo-650" />
                      <span>Current</span>
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
