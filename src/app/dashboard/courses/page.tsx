import { createClient } from '@/utils/supabase/server'
import { AddCourseDialog } from '@/components/dashboard/add-course-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createClient()

  // 1. Get Current User
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch User Profile to get Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isLecturer = profile?.role === 'lecturer'

  // 3. Fetch Courses Logic
  // If Lecturer: Fetch only courses created by them.
  // If Student: Fetch all available courses.
  let query = supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (isLecturer) {
    query = query.eq('lecturer_id', user.id)
  }

  const { data: courses, error } = await query

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLecturer ? 'Manage Courses' : 'Available Courses'}
          </h1>
          <p className="text-muted-foreground">
            {isLecturer 
              ? 'Create and manage your course materials and assignments.' 
              : 'Browse and access your enrolled course materials.'}
          </p>
        </div>
        
        {/* Only Lecturers can see the Add Button */}
        {isLecturer && <AddCourseDialog />}
      </div>

      {/* COURSES GRID */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
            <BookOpen className="h-10 w-10 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {isLecturer 
                ? "You haven't created any courses yet. Click the button above to get started." 
                : "No courses are available for enrollment at the moment."}
            </p>
          </div>
        ) : (
          courses?.map((course) => (
            <Card key={course.id} className="group hover:shadow-md transition-all duration-200 border-gray-200">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {course.code}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                    {course.level} Lvl
                  </Badge>
                </div>
                
                {/* Fixed Title: Added leading-tight and padding to prevent cut-off */}
                <CardTitle className="text-lg font-semibold leading-tight pb-1">
                  {course.title}
                </CardTitle>
                
                <CardDescription className="line-clamp-2 min-h-[40px]">
                  {course.description || "No description provided for this course."}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Link 
                  href={`/dashboard/courses/${course.id}`} 
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline underline-offset-4"
                >
                  {isLecturer ? 'Manage Materials' : 'View Course'} 
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}