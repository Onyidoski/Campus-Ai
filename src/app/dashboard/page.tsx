import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, PlusCircle, Bell, Megaphone, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // 1. Get User & Profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // 2. Fetch Dynamic Counts & Notifications based on Role
  let activeCoursesCount = 0
  let recentAnnouncements: any[] = []

  if (profile?.role === 'lecturer') {
    // Count how many courses this lecturer created
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('lecturer_id', user.id)
      
    activeCoursesCount = count || 0
  } else {
    // STUDENT LOGIC:
    // A. Count enrolled courses
    const { data: enrollments, count } = await supabase
      .from('enrollments')
      .select('course_id', { count: 'exact' })
      .eq('student_id', user.id)
      
    activeCoursesCount = count || 0

    // B. Fetch Recent Announcements from enrolled courses
    const courseIds = enrollments?.map(e => e.course_id) || []
    
    if (courseIds.length > 0) {
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*, courses(code, title), profiles:lecturer_id(full_name)')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(3) // Get the 3 most recent announcements
        
      recentAnnouncements = announcements || []
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* STATS CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold line-clamp-1" title={profile?.full_name}>
              {profile?.full_name}
            </div>
            <p className="text-xs text-muted-foreground capitalize mt-1">
              {profile?.role} • {profile?.role === 'student' ? `${profile?.academic_level} Level` : profile?.department || 'Staff'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {profile?.role === 'lecturer' ? 'Courses Managed' : 'Courses Enrolled'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCoursesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.role === 'lecturer' ? 'Total classes you teach' : 'Total active classes'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ANNOUNCEMENTS (STUDENTS ONLY) - CHANGED TO LIST VIEW */}
      {profile?.role === 'student' && recentAnnouncements.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Bell className="mr-2 h-5 w-5 text-blue-600" /> Recent Announcements
          </h2>
          
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {recentAnnouncements.map((announcement) => {
                const date = new Date(announcement.created_at)
                const isUrgent = announcement.is_urgent

                return (
                  <Link 
                    key={announcement.id} 
                    href={`/dashboard/courses/${announcement.course_id}?tab=stream`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-4 sm:px-6 flex gap-4 ${isUrgent ? 'bg-red-50/20 hover:bg-red-50/40' : ''}`}>
                      
                      {/* Icon */}
                      <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        isUrgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {isUrgent ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900">
                              {announcement.profiles?.full_name}
                            </p>
                            <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 h-4 bg-gray-100">
                              {announcement.courses?.code}
                            </Badge>
                            {isUrgent && (
                              <Badge variant="destructive" className="text-[10px] font-normal px-1.5 py-0 h-4">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {date.toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {announcement.content}
                        </p>
                      </div>

                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* QUICK ACTIONS SECTION */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        
        {profile?.role === 'lecturer' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-blue-50 p-3 rounded-full">
                  <PlusCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Manage Courses</h3>
                  <p className="text-sm text-muted-foreground mt-1">Create new classes or upload materials.</p>
                </div>
                <Button className="w-full mt-2" asChild>
                  <Link href="/dashboard/courses">Go to Courses</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : profile?.role === 'student' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-blue-50 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">My Courses</h3>
                  <p className="text-sm text-muted-foreground mt-1">Register for classes and view materials.</p>
                </div>
                <Button className="w-full mt-2" variant="outline" asChild>
                  <Link href="/dashboard/courses">View Courses</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-orange-50 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">Assignments</h3>
                  <p className="text-sm text-muted-foreground mt-1">Check pending deadlines and submit work.</p>
                </div>
                <Button className="w-full mt-2" variant="outline" asChild>
                  <Link href="/dashboard/assignments">View Assignments</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <p>Admin Controls</p>
        )}
      </div>
    </div>
  )
}