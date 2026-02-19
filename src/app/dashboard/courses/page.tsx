import { createClient } from '@/utils/supabase/server'
import { AddCourseDialog } from '@/components/dashboard/add-course-dialog'
import { JoinCourseDialog } from '@/components/dashboard/join-course-dialog'
import { RegisterCoursesDialog } from '@/components/dashboard/register-courses-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default async function CoursesPage() {
  const supabase = await createClient()

  // 1. Get Current User & Profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, academic_level')
    .eq('id', user.id)
    .single()

  const isLecturer = profile?.role === 'lecturer'

  let courses: any[] = []
  let availableCoursesToRegister: any[] = []

  if (isLecturer) {
    // LECTURERS: Fetch courses they created
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('lecturer_id', user.id)
      .order('created_at', { ascending: false })
    courses = data || []
  } else {
    // STUDENTS: 
    // A. Fetch courses they are already enrolled in
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        course_id,
        courses (*)
      `)
      .eq('student_id', user.id)
      .order('enrolled_at', { ascending: false })
    
    courses = enrollments?.map((enrollment: any) => enrollment.courses) || []
    const enrolledCourseIds = courses.map((c) => c.id)

    // B. Fetch ALL courses that match their exact academic level
    const { data: levelCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('level', profile?.academic_level) // e.g. '100', '400'
    
    // C. Filter out the ones they are already enrolled in so the registration list is clean
    availableCoursesToRegister = levelCourses?.filter(
      (course) => !enrolledCourseIds.includes(course.id)
    ) || []
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLecturer ? 'Manage Courses' : 'My Enrolled Courses'}
          </h1>
          <p className="text-muted-foreground">
            {isLecturer 
              ? 'Create and manage your course materials and assignments.' 
              : 'View materials and submit assignments for your active classes.'}
          </p>
        </div>
        
        {/* Dynamic Buttons Based on Role */}
        <div className="flex gap-2">
          {isLecturer ? (
            <AddCourseDialog /> 
          ) : (
            <>
              {/* Optional: Keep the Join Code button as a backup for out-of-level electives */}
              <JoinCourseDialog />
              {/* The new auto-suggest Registration checklist */}
              <RegisterCoursesDialog availableCourses={availableCoursesToRegister} />
            </>
          )}
        </div>
      </div>

      {/* COURSES GRID */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {courses?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
            <BookOpen className="h-10 w-10 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              {isLecturer ? 'No courses found' : 'Not enrolled in any courses'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {isLecturer 
                ? "You haven't created any courses yet. Click the button above to get started." 
                : "Click the 'Register Courses' button above to select classes for your level."}
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
                  {isLecturer ? 'Manage Materials' : 'Enter Course'} 
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