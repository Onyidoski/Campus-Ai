import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, UserCheck, Search } from 'lucide-react'
import { AssignLecturerCell } from '@/components/dashboard/admin/assign-lecturer-cell'
import { AdminCreateCourseDialog } from '@/components/dashboard/admin/admin-create-course-dialog'
import { AdminDeleteCourseButton } from '@/components/dashboard/admin/admin-delete-course-button'

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  // 1. Auth guard — admins only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const levelFilter = (resolvedSearchParams.level as string) || 'all'
  const searchQuery = (resolvedSearchParams.q as string) || ''

  // 2. Fetch all courses with lecturer info + enrollment counts
  let query = supabase
    .from('courses')
    .select('*, profiles:lecturer_id(id, full_name, email)')
    .order('code', { ascending: true })

  if (levelFilter !== 'all') {
    query = query.eq('level', levelFilter)
  }

  if (searchQuery) {
    query = query.or(`code.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
  }

  const { data: courses } = await query

  // 3. Fetch enrollment counts per course
  const courseIds = courses?.map(c => c.id) || []
  let enrollmentCounts: Record<string, number> = {}

  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .in('course_id', courseIds)

    enrollments?.forEach((e: any) => {
      enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1
    })
  }

  // 4. Fetch all lecturers for the assignment dropdown
  const { data: lecturers } = await supabase
    .from('profiles')
    .select('id, full_name, email, department')
    .eq('role', 'lecturer')
    .order('full_name', { ascending: true })

  // 5. Level counts
  const levels = ['100', '200', '300', '400']
  const levelCounts: Record<string, number> = { all: courses?.length || 0 }
  levels.forEach(lvl => {
    levelCounts[lvl] = courses?.filter(c => c.level === lvl).length || 0
  })

  // But we need separate counts since filtered query won't give us totals
  const [
    { count: totalAll },
    ...levelCountResults
  ] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    ...levels.map(lvl =>
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('level', lvl)
    ),
  ])

  const tabCounts: Record<string, number> = { all: totalAll || 0 }
  levels.forEach((lvl, i) => {
    tabCounts[lvl] = levelCountResults[i].count || 0
  })

  const levelTabs = [
    { key: 'all', label: 'All Levels', icon: BookOpen, color: 'text-slate-655 bg-slate-50 border border-slate-100/70' },
    { key: '100', label: '100 Level', icon: BookOpen, color: 'text-indigo-650 bg-indigo-50 border border-indigo-100/40' },
    { key: '200', label: '200 Level', icon: BookOpen, color: 'text-indigo-650 bg-indigo-50 border border-indigo-100/40' },
    { key: '300', label: '300 Level', icon: BookOpen, color: 'text-indigo-650 bg-indigo-50 border border-indigo-100/40' },
    { key: '400', label: '400 Level', icon: BookOpen, color: 'text-indigo-650 bg-indigo-50 border border-indigo-100/40' },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/40">
              <BookOpen className="h-4.5 w-4.5 text-indigo-650" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Course Management</h1>
          </div>
          <p className="text-xs text-slate-450 mt-1 pl-11">
            Manage all courses, assign lecturers, and track platform enrollments.
          </p>
        </div>
        <div className="pl-11 sm:pl-0 mt-2 sm:mt-0">
          <AdminCreateCourseDialog lecturers={lecturers || []} />
        </div>
      </div>

      {/* LEVEL FILTER TABS */}
      <div className="flex flex-wrap gap-2.5 pb-1">
        {levelTabs.map((tab) => {
          const isActive = levelFilter === tab.key
          return (
            <a
              key={tab.key}
              href={`/dashboard/admin/courses?level=${tab.key}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border shadow-xs ${
                isActive
                  ? 'bg-white border-slate-200 text-slate-800 shadow-sm scale-[1.01]'
                  : 'bg-white/50 border-slate-100/70 text-slate-500 hover:bg-white hover:border-slate-200 hover:text-slate-700 hover:shadow-xs'
              }`}
            >
              <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${tab.color} shrink-0`}>
                <tab.icon className="h-3.5 w-3.5" />
              </div>
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tabCounts[tab.key] || 0}
              </span>
            </a>
          )
        })}
      </div>

      {/* SEARCH BAR */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search by course code or title..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-medium text-slate-700
            focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400
            placeholder:text-slate-400 transition-all duration-200 shadow-xs"
        />
        <input type="hidden" name="level" value={levelFilter} />
      </form>

      {/* COURSES TABLE */}
      <Card className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          {(!courses || courses.length === 0) ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="mx-auto h-8 w-8 mb-3 opacity-20" />
              <h3 className="text-sm font-medium text-slate-800">No Courses Found</h3>
              <p className="text-xs mt-1 font-light">
                {searchQuery ? `No results for "${searchQuery}".` : 'No courses have been created yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 text-[10px] font-bold text-slate-455 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">
                <div className="col-span-4">Course</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-3">Assigned Lecturer</div>
                <div className="col-span-1 text-center">Students</div>
                <div className="col-span-1">Invite Code</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-100">
                {courses.map((course: any) => {
                  const lecturer = course.profiles
                  const studentCount = enrollmentCounts[course.id] || 0

                  return (
                    <div key={course.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 px-5 py-5 md:px-6 md:py-4 hover:bg-slate-50/30 transition-all duration-150 items-start md:items-center border-b border-slate-100 last:border-0 md:border-b">
                      {/* Course Info & Top Badges (Mobile & Desktop layout) */}
                      <div className="w-full md:col-span-4 flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono leading-none">
                            {course.code}
                          </span>
                          {/* Mobile-only Level badge */}
                          <span className="inline-flex md:hidden items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-600 leading-none">
                            {course.level} Lvl
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 leading-normal">{course.title}</p>
                        {course.description && (
                          <p className="text-[10px] text-slate-450 font-medium leading-relaxed mt-0.5">{course.description}</p>
                        )}
                      </div>

                      {/* Level Column (Desktop only) */}
                      <div className="hidden md:block md:col-span-1">
                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/60 text-slate-600">
                          {course.level} Lvl
                        </span>
                      </div>

                      {/* Desktop Divider (Mobile only) */}
                      <div className="w-full md:hidden border-t border-slate-100/80 my-1"></div>

                      {/* Mobile Metadata Grid */}
                      <div className="w-full md:w-auto md:contents grid grid-cols-2 md:grid-cols-none gap-4 md:gap-0 items-center">
                        {/* Assigned Lecturer */}
                        <div className="col-span-2 md:col-span-3 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-2.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider md:hidden">Lecturer</span>
                          {lecturer ? (
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-xs font-extrabold text-indigo-750 shrink-0">
                                {lecturer.full_name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{lecturer.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{lecturer.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-600 font-semibold italic flex items-center gap-1.5 bg-amber-50/50 border border-amber-100/50 px-2 py-1 rounded-lg w-fit leading-none select-none">
                              <UserCheck className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              Unassigned
                            </span>
                          )}
                        </div>

                        {/* Student Count */}
                        <div className="col-span-1 md:col-span-1 flex flex-col md:items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider md:hidden">Students</span>
                          <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-655 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg w-fit select-none">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span>{studentCount}</span>
                          </div>
                        </div>

                        {/* Invite Code */}
                        <div className="col-span-1 md:col-span-1 flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider md:hidden">Invite Code</span>
                          {course.invite_code ? (
                            <code className="text-[10px] font-bold font-mono bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md text-slate-600 leading-none w-fit">
                              {course.invite_code}
                            </code>
                          ) : (
                            <span className="text-[10px] text-slate-350 select-none pl-2">—</span>
                          )}
                        </div>
                      </div>

                      {/* Desktop Divider (Mobile only) */}
                      <div className="w-full md:hidden border-t border-slate-100/80 my-1"></div>

                      {/* Actions */}
                      <div className="w-full md:w-auto md:col-span-2 flex justify-between md:justify-end items-center gap-2 mt-2 md:mt-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider md:hidden">Management</span>
                        <div className="flex items-center gap-1.5">
                          <AssignLecturerCell
                            courseId={course.id}
                            courseCode={course.code}
                            currentLecturerId={lecturer?.id || null}
                            lecturers={lecturers || []}
                          />
                          <AdminDeleteCourseButton courseId={course.id} courseCode={course.code} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

