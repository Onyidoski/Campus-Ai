import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Check Auth Session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch User Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role || 'student'

  let unreadNotifications = 0
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

  return (
    <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-white">
      {/* Sidebar Component handles its own responsive behavior now */}
      <Sidebar userRole={userRole} unreadNotifications={unreadNotifications} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/10">
        {children}
      </main>
    </div>
  )
}
