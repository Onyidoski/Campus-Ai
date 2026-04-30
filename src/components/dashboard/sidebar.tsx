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
  LucideIcon
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

const roleNavItems: Record<string, { label: string; href: string; icon: LucideIcon; badge?: number }[]> = {
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
  userRole: 'student' | 'lecturer' | 'admin'
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
  const navItems = userRole === 'admin'
    ? baseNavItems
    : [
        ...baseNavItems.slice(0, 1),
        { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: unreadNotifications },
        ...baseNavItems.slice(1),
      ]

  const NavContent = () => (
    <div className="flex h-full flex-col justify-between py-4">
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Campus AI
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={cn("w-full justify-start", pathname === item.href && "bg-gray-200")}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2">
        <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* MOBILE TRIGGER */}
      <div className="md:hidden p-4 border-b flex items-center justify-between bg-white">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0">
            {/* Screen-reader only title to fix Radix UI accessibility error */}
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <NavContent />
          </SheetContent>
        </Sheet>
        <span className="font-semibold">Campus AI</span>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex h-screen w-64 flex-col border-r bg-gray-50/40">
        <NavContent />
      </div>
    </>
  )
}
