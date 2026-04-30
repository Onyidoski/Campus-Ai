import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, UserCheck, Plus, Search } from 'lucide-react'
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
    { key: 'all', label: 'All Levels' },
    { key: '100', label: '100 Level' },
    { key: '200', label: '200 Level' },
    { key: '300', label: '300 Level' },
    { key: '400', label: '400 Level' },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage all courses and assign lecturers.
          </p>
        </div>
        <AdminCreateCourseDialog lecturers={lecturers || []} />
      </div>

      {/* LEVEL FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {levelTabs.map((tab) => {
          const isActive = levelFilter === tab.key
          return (
            <a
              key={tab.key}
              href={`/dashboard/admin/courses?level=${tab.key}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-white border-gray-300 shadow-sm text-gray-900'
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tabCounts[tab.key] || 0}
              </span>
            </a>
          )
        })}
      </div>

      {/* SEARCH BAR */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search by course code or title..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
            transition-all duration-200 shadow-sm"
        />
        <input type="hidden" name="level" value={levelFilter} />
      </form>

      {/* COURSES TABLE */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {(!courses || courses.length === 0) ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <h3 className="text-lg font-medium text-gray-900">No Courses Found</h3>
              <p className="text-sm mt-1">
                {searchQuery ? `No results for "${searchQuery}".` : 'No courses have been created yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60 border-b">
                <div className="col-span-3">Course</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-3">Assigned Lecturer</div>
                <div className="col-span-1 text-center">Students</div>
                <div className="col-span-2">Invite Code</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-gray-100">
                {courses.map((course: any) => {
                  const lecturer = course.profiles
                  const studentCount = enrollmentCounts[course.id] || 0

                  return (
                    <div key={course.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center">
                      {/* Course Info */}
                      <div className="md:col-span-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="font-mono text-xs shrink-0">{course.code}</Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{course.title}</p>
                        {course.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{course.description}</p>
                        )}
                      </div>

                      {/* Level */}
                      <div className="md:col-span-1">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[10px]">
                          {course.level} Lvl
                        </Badge>
                      </div>

                      {/* Assigned Lecturer */}
                      <div className="md:col-span-3">
                        {lecturer ? (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center text-[10px] font-bold text-violet-700 shrink-0">
                              {lecturer.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{lecturer.full_name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{lecturer.email}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 italic flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            No lecturer assigned
                          </span>
                        )}
                      </div>

                      {/* Student Count */}
                      <div className="md:col-span-1 text-center">
                        <div className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          {studentCount}
                        </div>
                      </div>

                      {/* Invite Code */}
                      <div className="md:col-span-2">
                        {course.invite_code ? (
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {course.invite_code}
                          </code>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2 flex justify-end gap-1">
                        <AssignLecturerCell
                          courseId={course.id}
                          courseCode={course.code}
                          currentLecturerId={lecturer?.id || null}
                          lecturers={lecturers || []}
                        />
                        <AdminDeleteCourseButton courseId={course.id} courseCode={course.code} />
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
