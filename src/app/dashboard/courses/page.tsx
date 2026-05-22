import { createClient } from '@/utils/supabase/server'
import { AddCourseDialog } from '@/components/dashboard/add-course-dialog'
import { JoinCourseDialog } from '@/components/dashboard/join-course-dialog'
import { RegisterCoursesDialog } from '@/components/dashboard/register-courses-dialog'
import { CoursesGridWithSearch } from '@/components/dashboard/courses-grid-with-search'
import { redirect } from 'next/navigation'

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
  const isAdmin = profile?.role === 'admin'
  const isStudent = !isAdmin && !isLecturer

  let courses: any[] = []
  let availableCoursesToRegister: any[] = []

  if (isAdmin) {
    // ADMINS: See all courses across the platform
    const { data } = await supabase
      .from('courses')
      .select('*, profiles:lecturer_id(full_name)')
      .order('created_at', { ascending: false })
    courses = data || []
  } else if (isLecturer) {
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
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            {isAdmin ? 'All Courses' : isLecturer ? 'Manage Courses' : 'My Enrolled Courses'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 md:text-base">
            {isAdmin
              ? 'Overview of all courses on the platform.'
              : isLecturer 
                ? 'Create and manage your course materials and assignments.' 
                : 'View materials and submit assignments for your active classes.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {isLecturer ? (
            <AddCourseDialog /> 
          ) : !isAdmin && (
            <>
              <JoinCourseDialog />
              <RegisterCoursesDialog availableCourses={availableCoursesToRegister} />
            </>
          )}
        </div>
      </div>

      {isStudent && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Enrolled</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{courses.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Available to Register</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{availableCoursesToRegister.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Academic Level</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
              {profile?.academic_level ? `${profile.academic_level} Lvl` : 'N/A'}
            </p>
          </div>
        </div>
      )}

      <CoursesGridWithSearch
        courses={courses}
        role={isAdmin ? 'admin' : isLecturer ? 'lecturer' : 'student'}
        emptyTitle={isAdmin ? 'No courses on the platform yet' : isLecturer ? 'No courses found' : 'Not enrolled in any courses'}
        emptyDescription={
          isAdmin
            ? 'Lecturers have not created any courses yet.'
            : isLecturer
              ? "You have not created any courses yet. Click the button above to get started."
              : "Click the 'Register Courses' button above to select classes for your level."
        }
      />
    </div>
  )
}