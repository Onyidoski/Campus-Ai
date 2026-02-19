'use client'

import { useState } from 'react'
import { bulkEnrollCourses } from '@/app/dashboard/courses/actions'
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
import { CheckSquare, BookOpen } from 'lucide-react'

// We pass the available courses that match the student's level down to this component
export function RegisterCoursesDialog({ availableCourses }: { availableCourses: any[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => 
      prev.includes(courseId) 
        ? prev.filter((id) => id !== courseId) // Uncheck
        : [...prev, courseId] // Check
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course.')
      return
    }

    setLoading(true)
    const result = await bulkEnrollCourses(selectedCourses)
    setLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(result.success)
      setOpen(false)
      setSelectedCourses([]) // Reset selection
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckSquare className="mr-2 h-4 w-4" /> Register Courses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Course Registration</DialogTitle>
          <DialogDescription>
            Select the courses you want to enroll in for this semester. Only courses matching your academic level are shown.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {availableCourses.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
              <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No new courses available for your level at this time.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {availableCourses.map((course) => (
                <label 
                  key={course.id} 
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedCourses.includes(course.id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleToggleCourse(course.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 transition-colors"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-gray-900">
                      {course.code} <span className="font-normal mx-1">-</span> {course.title}
                    </span>
                    <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                      {course.description || 'No description provided.'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={loading || availableCourses.length === 0} 
              className="w-full sm:w-auto"
            >
              {loading ? 'Registering...' : `Enroll in ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}