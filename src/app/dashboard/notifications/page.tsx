import { redirect } from 'next/navigation'
import { Bell, CalendarClock, CheckCheck, Megaphone, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NotificationCardLink } from '@/components/dashboard/notification-card-link'
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from './actions'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  href?: string | null
  is_read: boolean
  created_at: string
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString([], {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function dayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

function getNotificationIcon(type: string) {
  if (type === 'assignment' || type === 'class') return CalendarClock
  if (type === 'announcement' || type === 'campus_announcement') return Megaphone
  return Bell
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    assignment: 'Assignment',
    class: 'Class',
    announcement: 'Course',
    campus_announcement: 'Campus',
  }

  return labels[type] || 'Notification'
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, message, href, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifications = (data || []) as Notification[]
  const unreadCount = notifications.filter((notification) => !notification.is_read).length
  const unreadNotifications = notifications.filter((notification) => !notification.is_read)
  const readNotifications = notifications.filter((notification) => notification.is_read)
  const todayCount = notifications.filter(
    (notification) => dayLabel(notification.created_at) === 'Today'
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Bell className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground sm:text-base">
            Assignment reminders, online class updates, and urgent announcements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{todayCount}</span> today
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{notifications.length}</span> total
          </div>
          {unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <Button variant="outline" className="active:scale-[0.98]">
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            </form>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">No notifications yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              New reminders will appear here when classes, assignments, or urgent announcements are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {unreadNotifications.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/40">
              <div className="border-b border-blue-100/80 px-4 py-3 sm:px-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Unread</p>
              </div>
              <div className="divide-y divide-blue-100/80">
                {unreadNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-blue-100/40 sm:grid-cols-[1fr_auto] sm:px-5"
                    >
                      <NotificationCardLink
                        notificationId={notification.id}
                        href={notification.href || '/dashboard/notifications'}
                        className="min-w-0"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-semibold text-slate-900">{notification.title}</h2>
                              <Badge variant="secondary" className="h-5 text-[10px]">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <Badge className="h-5 bg-blue-600 text-[10px] text-white hover:bg-blue-600">
                                New
                              </Badge>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">{formatDateTime(notification.created_at)}</p>
                          </div>
                        </div>
                      </NotificationCardLink>

                      <div className="flex items-start gap-2 sm:pl-3">
                        <form action={markNotificationRead.bind(null, notification.id)}>
                          <Button size="sm" variant="ghost" className="active:scale-[0.98]">
                            Mark read
                          </Button>
                        </form>
                        <form action={deleteNotification.bind(null, notification.id)}>
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">All activity</p>
            </div>
            <div className="divide-y divide-slate-100">
              {readNotifications.length === 0 ? (
                <div className="px-5 py-8 text-sm text-slate-500">No earlier notifications.</div>
              ) : (
                readNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[1fr_auto] sm:px-5"
                    >
                      <NotificationCardLink
                        notificationId={notification.id}
                        href={notification.href || '/dashboard/notifications'}
                        className="min-w-0"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-sm font-semibold text-slate-900">{notification.title}</h2>
                              <Badge variant="secondary" className="h-5 text-[10px]">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              <span className="text-[11px] text-slate-400">{dayLabel(notification.created_at)}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">{formatDateTime(notification.created_at)}</p>
                          </div>
                        </div>
                      </NotificationCardLink>

                      <div className="flex items-start sm:pl-3">
                        <form action={deleteNotification.bind(null, notification.id)}>
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600 active:scale-[0.98]"
                            title="Delete notification"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
