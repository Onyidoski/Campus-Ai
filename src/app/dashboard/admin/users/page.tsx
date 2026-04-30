import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, GraduationCap, UserCheck, UserX, Search } from 'lucide-react'
import { UserActionsCell } from '@/components/dashboard/admin/user-actions-cell'

export default async function AdminUsersPage({
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
  const roleFilter = (resolvedSearchParams.role as string) || 'all'
  const searchQuery = (resolvedSearchParams.q as string) || ''

  // 2. Build the query
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, academic_level, department, created_at')
    .order('created_at', { ascending: false })

  if (roleFilter !== 'all') {
    query = query.eq('role', roleFilter)
  }

  if (searchQuery) {
    query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  }

  const { data: users } = await query.limit(100)

  // 3. Role counts
  const [
    { count: totalAll },
    { count: totalStudents },
    { count: totalLecturers },
    { count: totalAdmins },
    { count: totalParents },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'parent'),
  ])

  const roleTabs = [
    { key: 'all', label: 'All', count: totalAll || 0, icon: Users, color: 'text-gray-600 bg-gray-100' },
    { key: 'student', label: 'Students', count: totalStudents || 0, icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
    { key: 'lecturer', label: 'Lecturers', count: totalLecturers || 0, icon: UserCheck, color: 'text-violet-600 bg-violet-50' },
    { key: 'admin', label: 'Admins', count: totalAdmins || 0, icon: Shield, color: 'text-red-600 bg-red-50' },
    { key: 'parent', label: 'Parents', count: totalParents || 0, icon: UserX, color: 'text-amber-600 bg-amber-50' },
  ]

  const roleColors: Record<string, string> = {
    student: 'bg-blue-50 text-blue-700 border-blue-200',
    lecturer: 'bg-violet-50 text-violet-700 border-violet-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
    parent: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage all registered users on the platform.
        </p>
      </div>

      {/* ROLE FILTER TABS */}
      <div className="flex flex-wrap gap-2">
        {roleTabs.map((tab) => {
          const isActive = roleFilter === tab.key
          return (
            <a
              key={tab.key}
              href={`/dashboard/admin/users?role=${tab.key}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? 'bg-white border-gray-300 shadow-sm text-gray-900'
                  : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <div className={`h-6 w-6 rounded-md flex items-center justify-center ${tab.color}`}>
                <tab.icon className="h-3.5 w-3.5" />
              </div>
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
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
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
            transition-all duration-200 shadow-sm"
        />
        {/* Preserve the role filter when searching */}
        <input type="hidden" name="role" value={roleFilter} />
      </form>

      {/* USERS TABLE */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {(!users || users.length === 0) ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <h3 className="text-lg font-medium text-gray-900">No Users Found</h3>
              <p className="text-sm mt-1">
                {searchQuery ? `No results for "${searchQuery}".` : 'No users in this category.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/60 border-b">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Level / Department</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-gray-100">
                {users.map((u: any) => {
                  const initial = u.full_name?.charAt(0).toUpperCase() || '?'
                  const date = u.created_at ? new Date(u.created_at) : null
                  const isSelf = u.id === user.id

                  return (
                    <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors items-center">
                      {/* User Info */}
                      <div className="md:col-span-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          u.role === 'admin'
                            ? 'bg-gradient-to-br from-red-100 to-orange-100 text-red-700'
                            : u.role === 'lecturer'
                              ? 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700'
                              : 'bg-gradient-to-br from-blue-100 to-sky-100 text-blue-700'
                        }`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.full_name}</p>
                            {isSelf && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 bg-gray-200">You</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <div className="md:col-span-2">
                        <Badge className={`text-[10px] px-1.5 py-0 h-5 capitalize ${roleColors[u.role] || 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </Badge>
                      </div>

                      {/* Level / Department */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-600">
                          {u.role === 'student'
                            ? `${u.academic_level || '—'} Level`
                            : u.department || '—'
                          }
                        </p>
                      </div>

                      {/* Joined Date */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500">
                          {date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-2 flex justify-end">
                        {isSelf ? (
                          <span className="text-[10px] text-gray-400 italic">Current user</span>
                        ) : (
                          <UserActionsCell userId={u.id} currentRole={u.role} userName={u.full_name} />
                        )}
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
