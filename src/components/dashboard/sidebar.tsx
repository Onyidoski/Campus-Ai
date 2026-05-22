'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  MessageSquare,
  Calendar,
  Menu,
  Video,
  Award,
  Lightbulb,
  HardDrive,
  BarChart3,
  Bell,
  LucideIcon,
  GraduationCap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useState } from 'react'

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

const roleNavItems: Record<string, NavItem[]> = {
  student: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
    { label: 'Timetable', href: '/dashboard/timetable', icon: Video },
    { label: 'Exams', href: '/dashboard/exams', icon: Calendar },
    { label: 'Assignments', href: '/dashboard/assignments', icon: Calendar },
    { label: 'Grades', href: '/dashboard/grades', icon: Award },
    { label: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
    { label: 'Offline Materials', href: '/dashboard/offline-materials', icon: HardDrive },
    { label: 'AI Companion', href: '/dashboard/ai-chat', icon: MessageSquare },
  ],
  lecturer: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Manage Courses', href: '/dashboard/courses', icon: BookOpen },
    { label: 'Timetable', href: '/dashboard/timetable', icon: Video },
    { label: 'Exams', href: '/dashboard/exams', icon: Calendar },
    { label: 'Grades', href: '/dashboard/grades', icon: Award },
    { label: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
    { label: 'Offline Materials', href: '/dashboard/offline-materials', icon: HardDrive },
    { label: 'Student Progress', href: '/dashboard/students', icon: Users },
  ],
  parent: [
    { label: 'Dashboard', href: '/dashboard/parent', icon: LayoutDashboard },
    { label: 'Timetable', href: '/dashboard/parent/timetable', icon: Calendar },
    { label: 'Exam Schedule', href: '/dashboard/parent/exams', icon: Calendar },
  ],
  admin: [
    { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'User Management', href: '/dashboard/admin/users', icon: Users },
    { label: 'Courses', href: '/dashboard/admin/courses', icon: BookOpen },
    { label: 'Exams', href: '/dashboard/admin/exams', icon: Calendar },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  ]
}

export function Sidebar({
  userRole,
  unreadNotifications = 0,
}: {
  userRole: 'student' | 'lecturer' | 'admin' | 'parent'
  unreadNotifications?: number
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const baseNavItems = roleNavItems[userRole as keyof typeof roleNavItems] || roleNavItems.student
  const navItems = (userRole === 'admin' || userRole === 'parent')
    ? baseNavItems
    : [
        ...baseNavItems.slice(0, 1),
        { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: unreadNotifications },
        ...baseNavItems.slice(1),
      ]

  const NavContent = () => (
    <div className="flex h-full flex-col py-6">
      <div className="px-6 flex items-center gap-3 mb-8 shrink-0">
        <GraduationCap className="h-8 w-8 text-slate-800" strokeWidth={1.8} />
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          EduPortal
        </h2>
      </div>
      
      <div className="px-3 space-y-1 overflow-y-auto flex-1 pb-4">
        {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/dashboard/admin' && item.href !== '/dashboard/parent' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 rounded-xl text-slate-600 transition-all font-medium",
                    isActive 
                      ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700" 
                      : "hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className={cn("mr-4 h-5 w-5", isActive ? "text-blue-600" : "text-slate-500")} strokeWidth={1.8} />
                  <span className="flex-1 text-left text-[15px]">{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-none text-white shadow-sm">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>
      
      <div className="px-3 mt-4 shrink-0 border-t border-slate-100 pt-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start h-12 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium" 
          onClick={handleLogout}
        >
          <LogOut className="mr-4 h-5 w-5 text-slate-500" strokeWidth={1.8} />
          <span className="text-[15px]">Logout</span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="md:hidden p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-slate-800" strokeWidth={1.8} />
          <span className="font-bold text-lg text-slate-900">EduPortal</span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:bg-slate-50">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-r-0 bg-white">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex h-screen w-[280px] flex-col border-r border-slate-100 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.02)] z-40">
        <NavContent />
      </aside>
    </>
  )
}
