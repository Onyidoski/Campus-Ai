import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get User & Profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
// --- ADD THIS DEBUG LINE ---
  console.log("DEBUG PROFILE:", profile) 
  // ---------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* WELCOME CARD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.full_name}</div>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role} • {profile?.role === 'student' ? `${profile?.academic_level} Level` : profile?.department || 'Staff'}
            </p>
          </CardContent>
        </Card>

        {/* STATS CARD (Placeholder) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Courses enrolled/managed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ROLE SPECIFIC CONTENT */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        
        {profile?.role === 'lecturer' ? (
          <div className="p-4 border border-dashed rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">
              You are a Lecturer. Go to "Manage Courses" to create your first course.
            </p>
          </div>
        ) : profile?.role === 'student' ? (
           <div className="p-4 border border-dashed rounded-lg bg-gray-50">
            <p className="text-sm text-gray-500">
              You are a Student. Wait for lecturers to add courses, or browse available ones.
            </p>
          </div>
        ) : (
          <p>Admin Controls</p>
        )}
      </div>
    </div>
  )
}