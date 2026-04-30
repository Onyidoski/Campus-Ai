import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users, BookOpen, FileText, GraduationCap, Megaphone,
  AlertCircle, Trash2, TrendingUp, Video, Brain, Shield,
  UserCheck, UserX, ChevronRight
} from 'lucide-react'
import { CampusAnnouncementDialog } from '@/components/dashboard/admin/campus-announcement-dialog'
import { deleteCampusAnnouncement } from './actions'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Auth guard — admins only
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // 2. Fetch system-wide stats
  const [
    { count: totalUsers },
    { count: totalStudents },
    { count: totalLecturers },
    { count: totalAdmins },
    { count: totalCourses },
    { count: totalMaterials },
    { count: totalAssignments },
    { count: totalSubmissions },
    { count: totalEnrollments },
    { count: totalOnlineClasses },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('materials').select('*', { count: 'exact', head: true }),
    supabase.from('assignments').select('*', { count: 'exact', head: true }),
    supabase.from('submissions').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('online_classes').select('*', { count: 'exact', head: true }),
  ])

  // 3. Recent users (newest 5)
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, academic_level, department, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. Campus announcements
  const { data: campusAnnouncements } = await supabase
    .from('campus_announcements')
    .select('*, profiles:admin_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // 5. Recent courses
  const { data: recentCourses } = await supabase
    .from('courses')
    .select('id, code, title, level, created_at, profiles:lecturer_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  const roleColors: Record<string, string> = {
    student: 'bg-blue-50 text-blue-700 border-blue-200',
    lecturer: 'bg-violet-50 text-violet-700 border-violet-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
    parent: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            System overview and management for Campus AI.
          </p>
        </div>
        <CampusAnnouncementDialog />
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalUsers || 0}</p>
              <p className="text-[11px] text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalStudents || 0}</p>
              <p className="text-[11px] text-muted-foreground">Students</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalLecturers || 0}</p>
              <p className="text-[11px] text-muted-foreground">Lecturers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCourses || 0}</p>
              <p className="text-[11px] text-muted-foreground">Courses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEnrollments || 0}</p>
              <p className="text-[11px] text-muted-foreground">Enrollments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECONDARY STATS ROW */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalMaterials || 0}</p>
              <p className="text-[10px] text-muted-foreground">Materials Uploaded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalAssignments || 0}</p>
              <p className="text-[10px] text-muted-foreground">Assignments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalSubmissions || 0}</p>
              <p className="text-[10px] text-muted-foreground">Submissions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Video className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalOnlineClasses || 0}</p>
              <p className="text-[10px] text-muted-foreground">Online Classes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TWO-COLUMN LAYOUT: ANNOUNCEMENTS + RECENT USERS */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* CAMPUS ANNOUNCEMENTS */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-red-600" />
                  Campus Announcements
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Visible to all users on the platform
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!campusAnnouncements || campusAnnouncements.length === 0) ? (
              <div className="text-center py-10 text-muted-foreground">
                <Megaphone className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No campus announcements yet.</p>
                <p className="text-xs mt-1">Post your first announcement to reach all users.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {campusAnnouncements.map((a: any) => {
                  const date = new Date(a.created_at)
                  return (
                    <div key={a.id} className={`p-4 flex gap-3 group ${a.is_urgent ? 'bg-red-50/30' : ''}`}>
                      <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                        a.is_urgent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {a.is_urgent ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-medium text-gray-900">
                            {a.profiles?.full_name || 'Admin'}
                          </span>
                          {a.is_urgent && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Urgent</Badge>
                          )}
                          {a.target_level && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {a.target_level} Level Only
                            </Badge>
                          )}
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-3">
                          {a.content}
                        </p>
                      </div>
                      <form action={deleteCampusAnnouncement.bind(null, a.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RECENT USERS */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Recent Users
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Newest accounts on the platform
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                <Link href="/dashboard/admin/users">
                  View All <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!recentUsers || recentUsers.length === 0) ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No users found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentUsers.map((u: any) => {
                  const initial = u.full_name?.charAt(0).toUpperCase() || '?'
                  const date = u.created_at ? new Date(u.created_at) : null
                  return (
                    <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        u.role === 'admin'
                          ? 'bg-red-100 text-red-700'
                          : u.role === 'lecturer'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge className={`text-[10px] px-1.5 py-0 h-4 capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </Badge>
                        {date && (
                          <span className="text-[10px] text-gray-400">
                            {date.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT COURSES */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            Recently Created Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!recentCourses || recentCourses.length === 0) ? (
            <div className="text-center py-10 text-muted-foreground">
              <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No courses created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentCourses.map((c: any) => {
                const date = c.created_at ? new Date(c.created_at) : null
                return (
                  <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                      {c.code?.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">{c.code}</Badge>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {c.profiles?.full_name || 'Unknown'} • {c.level} Level
                      </p>
                    </div>
                    {date && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {date.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
