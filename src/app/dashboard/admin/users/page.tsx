import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, GraduationCap, UserCheck, User, Search } from 'lucide-react'
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
    { key: 'all', label: 'All', count: totalAll || 0, icon: Users, color: 'text-slate-600 bg-slate-50 border border-slate-100/70' },
    { key: 'student', label: 'Students', count: totalStudents || 0, icon: GraduationCap, color: 'text-indigo-650 bg-indigo-50 border border-indigo-100/40' },
    { key: 'lecturer', label: 'Lecturers', count: totalLecturers || 0, icon: UserCheck, color: 'text-indigo-650 bg-indigo-50 border border-indigo-100/40' },
    { key: 'admin', label: 'Admins', count: totalAdmins || 0, icon: Shield, color: 'text-rose-600 bg-rose-50 border border-rose-100/40' },
    { key: 'parent', label: 'Parents', count: totalParents || 0, icon: User, color: 'text-slate-655 bg-slate-50 border border-slate-100' },
  ]

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100/40">
            <Users className="h-4.5 w-4.5 text-indigo-650" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">User Management</h1>
        </div>
        <p className="text-xs text-slate-450 mt-1 pl-11">
          View, audit, and modify registered accounts across the platform.
        </p>
      </div>

      {/* ROLE FILTER TABS */}
      <div className="flex flex-wrap gap-2.5 pb-1">
        {roleTabs.map((tab) => {
          const isActive = roleFilter === tab.key
          return (
            <a
              key={tab.key}
              href={`/dashboard/admin/users?role=${tab.key}${searchQuery ? `&q=${searchQuery}` : ''}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border shadow-xs ${
                isActive
                  ? 'bg-white border-slate-200 text-slate-800 shadow-sm scale-[1.01]'
                  : 'bg-white/50 border-slate-100/70 text-slate-500 hover:bg-white hover:border-slate-200 hover:text-slate-700 hover:shadow-xs'
              }`}
            >
              <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${tab.color} shrink-0`}>
                <tab.icon className="h-3.5 w-3.5" />
              </div>
              <span>{tab.label}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none transition-colors ${
                isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            </a>
          )
        })}
      </div>

      {/* SEARCH BAR */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 bg-white text-xs font-medium text-slate-700
            focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400
            placeholder:text-slate-400 transition-all duration-200 shadow-xs"
        />
        {/* Preserve the role filter when searching */}
        <input type="hidden" name="role" value={roleFilter} />
      </form>

      {/* USERS TABLE */}
      <Card className="overflow-hidden bg-white border border-slate-100 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          {(!users || users.length === 0) ? (
            <div className="text-center py-16 text-slate-400">
              <Users className="mx-auto h-8 w-8 mb-3 opacity-20" />
              <h3 className="text-sm font-medium text-slate-800">No Users Found</h3>
              <p className="text-xs mt-1 font-light">
                {searchQuery ? `No results for "${searchQuery}".` : 'No users registered under this role.'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-4 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-3">Academic Info</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-100">
                {users.map((u: any) => {
                  const initial = u.full_name?.charAt(0).toUpperCase() || '?'
                  const date = u.created_at ? new Date(u.created_at) : null
                  const isSelf = u.id === user.id

                  return (
                    <div key={u.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-4 hover:bg-slate-50/30 transition-all duration-150 items-center">
                      {/* User Info */}
                      <div className="md:col-span-4 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 border-rose-100 text-rose-700'
                            : u.role === 'lecturer'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                              : 'bg-slate-50 border border-slate-100 text-slate-700'
                        }`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-slate-800 truncate">{u.full_name}</p>
                            {isSelf && (
                              <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider leading-none shrink-0">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{u.email}</p>
                        </div>
                      </div>

                      {/* Role */}
                      <div className="md:col-span-2">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 border-rose-100/40 text-rose-600'
                            : u.role === 'lecturer'
                              ? 'bg-indigo-50 border-indigo-100/40 text-indigo-650'
                              : 'bg-slate-50 border border-slate-200/50 text-slate-655'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      {/* Level / Department */}
                      <div className="md:col-span-3">
                        <p className="text-xs text-slate-600 font-medium truncate">
                          {u.role === 'student'
                            ? `${u.academic_level || '—'} Level`
                            : u.department || '—'
                          }
                        </p>
                      </div>

                      {/* Joined Date */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-slate-450 font-medium">
                          {date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="md:col-span-1 flex justify-end">
                        {isSelf ? (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md leading-none select-none">
                            Current User
                          </span>
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
