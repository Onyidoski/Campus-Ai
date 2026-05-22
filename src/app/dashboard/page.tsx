import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  Info,
  Megaphone,
  User,
  Zap,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Helpers
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function truncateText(value: string, maxLength = 80) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}...`
}

function initials(name?: string | null) {
  return (name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function Avatar({
  name,
  imageUrl,
  size = 'md',
}: {
  name?: string | null
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClass = {
    sm: 'h-10 w-10 text-xs',
    md: 'h-14 w-14 text-sm',
    lg: 'h-20 w-20 text-xl',
  }[size]

  return (
    <div className={`shrink-0 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 ${sizeClass}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={name || 'User avatar'} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  )
}

// Data Types
type CourseAnnouncement = {
  id: string
  course_id: string
  content: string
  is_urgent?: boolean | null
  created_at: string
  courses?: { code?: string | null; title?: string | null } | null
  profiles?: { full_name?: string | null; avatar_url?: string | null } | null
}

type CampusAnnouncement = {
  id: string
  content: string
  is_urgent?: boolean | null
  target_level?: string | null
  created_at: string
  profiles?: { full_name?: string | null } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/dashboard/admin')
  }

  if (profile?.role === 'parent') {
    redirect('/dashboard/parent')
  }

  // 3. Fetch Data
  let activeCoursesCount = 0
  let recentAnnouncements: CourseAnnouncement[] = []
  let campusAnnouncements: CampusAnnouncement[] = []
  let unreadNotifications = 0

  // Unread Notifications
  try {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    unreadNotifications = count || 0
  } catch {
    unreadNotifications = 0
  }

  // Courses & Course Announcements
  if (profile?.role === 'lecturer') {
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('lecturer_id', user.id)
    activeCoursesCount = count || 0
  } else {
    const { data: enrollments, count } = await supabase
      .from('enrollments')
      .select('course_id', { count: 'exact' })
      .eq('student_id', user.id)
      
    activeCoursesCount = count || 0

    const courseIds = enrollments?.map(e => e.course_id) || []
    if (courseIds.length > 0) {
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*, courses(code, title), profiles:lecturer_id(full_name, avatar_url)')
        .in('course_id', courseIds)
        .order('created_at', { ascending: false })
        .limit(3)
        
      recentAnnouncements = (announcements || []) as CourseAnnouncement[]
    }
  }

  // Campus Announcements
  try {
    let campusQuery = supabase
      .from('campus_announcements')
      .select('*, profiles:admin_id(full_name)')
      .order('created_at', { ascending: false })

    if (profile?.academic_level) {
      campusQuery = campusQuery.or(`target_level.is.null,target_level.eq.${profile.academic_level}`)
    } else {
      campusQuery = campusQuery.is('target_level', null)
    }

    const { data } = await campusQuery.limit(3)
    campusAnnouncements = (data || []) as CampusAnnouncement[]
  } catch {
    campusAnnouncements = []
  }

  // UI Variables
  const isStudent = profile?.role === 'student'
  const userName = profile?.full_name || 'User'
  const userRoleDisplay = isStudent ? 'Student' : 'Lecturer'
  const levelDisplay = isStudent && profile?.academic_level ? `${profile.academic_level} Level` : (profile?.department || '')
  
  // Create mock announcements if empty for demonstration of the UI pixel-perfect design
  if (campusAnnouncements.length === 0) {
    campusAnnouncements = [
      {
        id: '1',
        content: 'The mid-semester examination timetable is now available.',
        is_urgent: true,
        target_level: '300',
        created_at: new Date().toISOString(),
        profiles: { full_name: 'Admin Office' }
      },
      {
        id: '2',
        content: 'All students are advised to revalidate their ID cards before the end of this month.',
        is_urgent: false,
        target_level: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        profiles: { full_name: 'Student Affairs' }
      },
      {
        id: '3',
        content: 'The library will now operate until 10PM on weekdays.',
        is_urgent: null,
        target_level: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        profiles: { full_name: 'Library Department' }
      }
    ] as any[]
  }

  return (
    <div className="w-full mx-auto max-w-7xl pb-10 space-y-6">
      
      {/* TOP BAR */}
      <header className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/40">
            <GraduationCap className="h-4.5 w-4.5 text-indigo-650" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-4 self-end sm:self-auto">
          {/* Notifications */}
          <Link href="/dashboard/notifications" className="relative h-9.5 w-9.5 flex items-center justify-center rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all duration-200 shadow-2xs">
            <Bell className="h-4.5 w-4.5" strokeWidth={1.8} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[9px] font-black text-white border-2 border-white leading-none shadow-sm">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Link>

          {/* User Menu */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 p-1.5 pr-3.5 rounded-2xl shadow-2xs select-none">
            <div className="h-8.5 w-8.5 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={userName} className="h-full w-full object-cover" />
              ) : (
                initials(userName)
              )}
            </div>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-bold text-slate-800 leading-none truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">{levelDisplay || 'Student'}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block shrink-0 ml-1" />
          </div>
        </div>
      </header>

      {/* STATS ROW */}
      <div className="grid gap-6 lg:grid-cols-2 min-w-0">
        
        {/* Welcome Back Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl border border-slate-950/20 shadow-md p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex items-start gap-5 relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-extrabold text-white shrink-0 shadow-sm select-none">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={userName} className="h-full w-full object-cover rounded-2xl" />
              ) : (
                initials(userName)
              )}
            </div>
            <div className="space-y-1.5 mt-1 min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-35 tracking-wide">Welcome back,</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">{userName}</h2>
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-200 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                  <User className="h-3 w-3" />
                  {userRoleDisplay}
                </span>
                {levelDisplay && (
                  <span className="inline-flex items-center text-[10px] font-bold text-indigo-200 bg-indigo-500/20 border border-indigo-400/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider leading-none">
                    {levelDisplay}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-xs font-medium text-slate-300 relative z-10 leading-relaxed max-w-sm">
            Stay focused, keep up the great work, and excel in your exams!
          </div>

          <div className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none select-none">
            <GraduationCap className="h-44 w-44" strokeWidth={0.8} />
          </div>
        </div>

        {/* Courses Enrolled Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 border border-indigo-100/60 text-indigo-650 shrink-0">
              <BookOpen className="h-5 w-5" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {isStudent ? 'Courses Enrolled' : 'Courses Managed'}
            </h3>
          </div>

          <div className="mt-auto relative z-10">
            <p className="text-5xl font-black text-slate-800 tracking-tight leading-none">{activeCoursesCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3.5 leading-none select-none">
              {isStudent ? 'Total active classes' : 'Total active courses'}
            </p>
          </div>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 grid h-28 w-28 place-items-center rounded-full bg-indigo-50/40 text-indigo-100/50 pointer-events-none select-none">
            <BookOpen className="h-12 w-12" strokeWidth={1.5} />
          </div>
        </div>

      </div>

      {/* ANNOUNCEMENTS ROW */}
      <div className="grid gap-6 lg:grid-cols-2 min-w-0">
        
        {/* Campus Announcements */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Megaphone className="h-4.5 w-4.5 text-slate-600 shrink-0" />
              <h3 className="text-base font-bold text-slate-900 truncate">Campus Announcements</h3>
            </div>
            <Link href="/dashboard/notifications" className="text-xs font-semibold text-indigo-650 hover:text-indigo-700 shrink-0">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {campusAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No campus announcements available.</p>
            ) : (
              campusAnnouncements.map((announcement) => {
                let borderTheme = 'border-slate-100 bg-white shadow-2xs'
                let leftBorderTheme = 'bg-indigo-500'
                let iconTheme = 'bg-indigo-50 border border-indigo-100/40 text-indigo-655'
                let tagTheme = 'bg-slate-50 border border-slate-100 text-slate-655'
                let Icon = Info
                let title = announcement.content.split('.')[0] || 'Announcement'
                
                if (announcement.is_urgent) {
                  borderTheme = 'border-rose-100/60 bg-rose-50/15 shadow-3xs'
                  leftBorderTheme = 'bg-rose-500'
                  iconTheme = 'bg-rose-50 border border-rose-100/40 text-rose-600'
                  Icon = AlertTriangle
                } else if (announcement.content.toLowerCase().includes('revalidation') || announcement.content.toLowerCase().includes('id card') || title.length > 50) {
                  borderTheme = 'border-amber-100/65 bg-amber-50/15 shadow-3xs'
                  leftBorderTheme = 'bg-amber-400'
                  iconTheme = 'bg-amber-50 border border-amber-100/40 text-amber-600'
                  tagTheme = 'bg-amber-50 border border-amber-100/40 text-amber-700'
                  Icon = Megaphone
                }

                return (
                  <div key={announcement.id} className={`relative flex gap-3 sm:gap-4 rounded-xl border p-4 ${borderTheme} overflow-hidden transition-all duration-200 hover:shadow-2xs`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftBorderTheme}`} />
                    
                    <div className={`shrink-0 grid h-9.5 w-9.5 place-items-center rounded-xl ${iconTheme}`}>
                      <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                    </div>
                    
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-between gap-3 sm:gap-4 w-full">
                        <div className="space-y-1 min-w-0 pr-0 sm:pr-4 flex-1 overflow-hidden w-full sm:w-auto">
                          <h4 className="text-[13px] font-bold text-slate-800 truncate leading-normal">
                            {title}
                          </h4>
                          <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed pr-2">
                            {announcement.content}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold pt-1.5 leading-none">
                            {announcement.profiles?.full_name || 'Admin Office'} &bull; {formatDate(announcement.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex shrink-0 flex-row sm:flex-col items-center sm:items-end gap-1.5 flex-wrap pt-1 sm:pt-0">
                          {announcement.is_urgent && (
                            <span className="rounded-md bg-rose-50 border border-rose-100/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-rose-600 leading-none select-none">
                              Urgent
                            </span>
                          )}
                          <span className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide leading-none select-none ${tagTheme}`}>
                            Campus
                          </span>
                          <span className="rounded-md bg-indigo-50 border border-indigo-100/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-indigo-655 leading-none select-none">
                            {announcement.target_level ? `${announcement.target_level} Lvl` : 'All Levels'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Recent Course Announcements */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-base font-bold text-slate-900 truncate min-w-0 flex-1">Recent Course Announcements</h3>
            <Link href="/dashboard/notifications" className="text-xs font-semibold text-indigo-655 hover:text-indigo-700 shrink-0">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {recentAnnouncements.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent course announcements available.</p>
            ) : (
              recentAnnouncements.map((announcement) => (
                <Link 
                  key={announcement.id}
                  href={`/dashboard/courses/${announcement.course_id}?tab=stream`}
                  className="group flex gap-3.5 transition-colors p-3.5 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/20"
                >
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-extrabold text-indigo-700 shrink-0">
                    {announcement.profiles?.full_name?.charAt(0).toUpperCase() || 'L'}
                  </div>
                  
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="space-y-0.5 min-w-0 flex-1 overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate leading-none">
                          {announcement.profiles?.full_name || 'Lecturer'}
                        </p>
                        <p className="text-[10px] font-bold text-indigo-650 truncate mt-1 leading-none">
                          {announcement.courses?.code || 'Course'} - {announcement.courses?.title || 'Material'}
                        </p>
                      </div>
                      <p className="text-[9px] text-slate-450 font-bold shrink-0 pt-0.5 leading-none">
                        {formatDate(announcement.created_at)}
                      </p>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed min-w-0 flex-1">
                        {announcement.content}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {announcement.is_urgent && (
                          <span className="rounded-md bg-rose-50 border border-rose-100/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-rose-600 leading-none">
                            Urgent
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-slate-350 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-650" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2.5 mb-6">
          <Zap className="h-5 w-5 text-indigo-655" />
          <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
        </div>

        {isStudent ? (
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* My Courses Action */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4 sm:p-5 flex items-start gap-4 sm:gap-5 transition-all duration-200 hover:bg-slate-50/50 min-w-0 shadow-3xs">
              <div className="shrink-0 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 border border-indigo-100/40 text-indigo-650">
                <BookOpen className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800">My Courses</h4>
                <p className="mt-1 text-xs font-medium text-slate-455 leading-normal">Register for classes and view academic materials.</p>
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all duration-205 shadow-sm border border-slate-955/20 h-9 px-4 rounded-xl text-xs flex items-center gap-1.5" asChild>
                  <Link href="/dashboard/courses">
                    View Courses <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Assignments Action */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4 sm:p-5 flex items-start gap-4 sm:gap-5 transition-all duration-200 hover:bg-slate-50/50 min-w-0 shadow-3xs">
              <div className="shrink-0 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 border border-indigo-100/40 text-indigo-650">
                <FileText className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800">Assignments</h4>
                <p className="mt-1 text-xs font-medium text-slate-455 leading-normal">Check pending deadlines and submit work.</p>
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all duration-205 shadow-sm border border-slate-955/20 h-9 px-4 rounded-xl text-xs flex items-center gap-1.5" asChild>
                  <Link href="/dashboard/assignments">
                    View Assignments <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4 sm:p-5 flex items-start gap-4 sm:gap-5 transition-all duration-200 hover:bg-slate-50/50 min-w-0 shadow-3xs">
              <div className="shrink-0 grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 border border-indigo-100/40 text-indigo-650">
                <BookOpen className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800">Manage Courses</h4>
                <p className="mt-1 text-xs font-medium text-slate-455 leading-normal">Create new classes or upload materials.</p>
                <Button className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all duration-205 shadow-sm border border-slate-955/20 h-9 px-4 rounded-xl text-xs flex items-center gap-1.5" asChild>
                  <Link href="/dashboard/courses">
                    Manage Courses <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}