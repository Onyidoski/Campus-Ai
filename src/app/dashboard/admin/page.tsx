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
    student: 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider',
    lecturer: 'bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider',
    admin: 'bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider',
    parent: 'bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider',
  }

  return (
    <div className="w-full mx-auto max-w-7xl pb-12 px-4 sm:px-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-md">
              <Shield className="h-5 w-5 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">System-wide overview, database insights, and announcements.</p>
        </div>
        <CampusAnnouncementDialog />
      </header>

      {/* SYSTEM HERO & QUICK ACCESS */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Welcome & System Hero */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-850 to-rose-950 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden text-white border border-slate-800">
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-rose-450 text-xs font-semibold tracking-wider uppercase">System Operations</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1.5 tracking-tight">System Status Overview</h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md leading-relaxed font-light">
                Monitor account health, database models, class timetables, and campus-wide notifications in a clean, unified control deck.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-6 sm:mt-8 pt-4 border-t border-white/5">
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 flex flex-col">
                <span className="text-2xl font-bold text-white">{totalUsers || 0}</span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Total Accounts</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 flex flex-col">
                <span className="text-2xl font-bold text-white">{totalCourses || 0}</span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Active Courses</span>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl px-4 py-2.5 border border-white/10 flex flex-col">
                <span className="text-2xl font-bold text-white">{totalOnlineClasses || 0}</span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">Online Streams</span>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none">
            <Shield className="h-56 w-56 transform -rotate-12" strokeWidth={0.6} />
          </div>
        </div>

        {/* Administration Links */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                <Shield className="h-5 w-5 text-slate-650" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Quick Access</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-wider">Administrative Modules</p>
            <div className="space-y-2">
              <Link href="/dashboard/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all duration-200 group border border-slate-100/40">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" /> User Management
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/dashboard/admin/courses" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all duration-200 group border border-slate-100/40">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-slate-500" /> Course Allocations
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/dashboard/admin/exams" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-all duration-200 group border border-slate-100/40">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" /> Exam Coordinator
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED STATS GRID */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-8">
        <div className="bg-white py-4 px-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all duration-300">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4.5 w-4.5 text-indigo-650" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-slate-800 leading-tight">{totalStudents || 0}</p>
            <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wide truncate mt-0.5" title="Students">Students</p>
          </div>
        </div>

        <div className="bg-white py-4 px-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all duration-300">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <UserCheck className="h-4.5 w-4.5 text-indigo-650" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-slate-800 leading-tight">{totalLecturers || 0}</p>
            <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wide truncate mt-0.5" title="Lecturers">Lecturers</p>
          </div>
        </div>

        <div className="bg-white py-4 px-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all duration-300">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-650" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-slate-800 leading-tight">{totalEnrollments || 0}</p>
            <p className="text-[10px] text-slate-455 font-semibold uppercase tracking-wide truncate mt-0.5" title="Enrollments">Enrollments</p>
          </div>
        </div>

        <div className="bg-white py-4 px-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all duration-300">
          <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-slate-800 leading-tight">{totalMaterials || 0}</p>
            <p className="text-[10px] text-slate-455 font-semibold uppercase tracking-wide truncate mt-0.5" title="Materials">Materials</p>
          </div>
        </div>

        <div className="bg-white py-4 px-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all duration-300">
          <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-slate-800 leading-tight">{totalAssignments || 0}</p>
            <p className="text-[10px] text-slate-455 font-semibold uppercase tracking-wide truncate mt-0.5" title="Assignments">Assignments</p>
          </div>
        </div>

        <div className="bg-white py-4 px-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 hover:shadow-md transition-all duration-300">
          <div className="h-9 w-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
            <Brain className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-slate-800 leading-tight">{totalSubmissions || 0}</p>
            <p className="text-[10px] text-slate-455 font-semibold uppercase tracking-wide truncate mt-0.5" title="Submissions">Submissions</p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN ANNOUNCEMENTS & RECENT USERS */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        
        {/* CAMPUS ANNOUNCEMENTS */}
        <Card className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Megaphone className="h-4.5 w-4.5 text-slate-900" />
                  Campus Announcements
                </CardTitle>
                <CardDescription className="text-xs text-slate-450 mt-0.5">
                  Visible to all users on the platform
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!campusAnnouncements || campusAnnouncements.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <Megaphone className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No campus announcements yet.</p>
                <p className="text-xs mt-1 font-light">Create an announcement to reach the campus community.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {campusAnnouncements.map((a: any) => {
                  const date = new Date(a.created_at)
                  return (
                    <div key={a.id} className={`p-4 flex gap-3 group transition-colors duration-150 hover:bg-slate-50/30 ${a.is_urgent ? 'bg-rose-50/20' : 'bg-transparent'}`}>
                      <div className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        a.is_urgent 
                          ? 'bg-rose-50 border-rose-100/50 text-rose-600' 
                          : 'bg-slate-50 border-slate-100/70 text-slate-500'
                      }`}>
                        {a.is_urgent ? <AlertCircle className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-bold text-slate-800">
                            {a.profiles?.full_name || 'Admin'}
                          </span>
                          {a.is_urgent && (
                            <span className="bg-rose-55 border border-rose-100/40 text-rose-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                              Urgent
                            </span>
                          )}
                          {a.target_level && (
                            <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                              {a.target_level} Level
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium ml-auto">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed font-light">
                          {a.content}
                        </p>
                      </div>
                      <form action={deleteCampusAnnouncement.bind(null, a.id)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
        <Card className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-slate-900" />
                  Recent Users
                </CardTitle>
                <CardDescription className="text-xs text-slate-450 mt-0.5">
                  Newest accounts on the platform
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="text-xs h-7 border-slate-200 hover:bg-slate-50 rounded-lg" asChild>
                <Link href="/dashboard/admin/users">
                  View All <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {(!recentUsers || recentUsers.length === 0) ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No users found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentUsers.map((u: any) => {
                  const initial = u.full_name?.charAt(0).toUpperCase() || '?'
                  const date = u.created_at ? new Date(u.created_at) : null
                  return (
                    <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-slate-50/30 transition-colors">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 border ${
                        u.role === 'admin'
                          ? 'bg-rose-50 border-rose-100 text-rose-700'
                          : u.role === 'lecturer'
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : 'bg-slate-50 border-slate-100 text-slate-700'
                      }`}>
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{u.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`${roleColors[u.role] || 'bg-slate-50 text-slate-655'}`}>
                          {u.role}
                        </span>
                        {date && (
                          <span className="text-[10px] text-slate-400 font-medium">
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
      <Card className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-4 sm:p-5">
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="h-4.5 w-4.5 text-slate-900" />
            Recently Created Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!recentCourses || recentCourses.length === 0) ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="mx-auto h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm font-medium">No courses created yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCourses.map((c: any) => {
                const date = c.created_at ? new Date(c.created_at) : null
                return (
                  <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-slate-50/30 transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-extrabold text-slate-700 shrink-0 uppercase">
                      {c.code?.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {c.profiles?.full_name || 'Unassigned'} &bull; {c.level} Level
                      </p>
                    </div>
                    {date && (
                      <span className="text-[10px] text-slate-450 shrink-0 font-medium">
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
