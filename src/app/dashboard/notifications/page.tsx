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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          </div>
          <p className="text-muted-foreground">
            Assignment reminders, online class updates, and urgent announcements.
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <Button variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No notifications yet</h2>
            <p className="text-sm text-muted-foreground mt-1">
              New reminders will appear here when classes, assignments, or urgent announcements are created.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-xl border bg-white overflow-hidden">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type)
            const createdAt = new Date(notification.created_at)

            return (
              <div key={notification.id} className="relative">
                <div className={`grid grid-cols-[1fr_auto] gap-3 p-4 transition-colors hover:bg-gray-50 ${notification.is_read ? 'bg-white' : 'bg-blue-50/40 hover:bg-blue-50/70'}`}>
                  <NotificationCardLink
                    notificationId={notification.id}
                    href={notification.href || '/dashboard/notifications'}
                    className="min-w-0"
                  >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                      notification.is_read ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-sm text-gray-900">{notification.title}</h2>
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {getTypeLabel(notification.type)}
                        </Badge>
                        {!notification.is_read && (
                          <Badge className="text-[10px] h-5 bg-blue-600 text-white">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {createdAt.toLocaleDateString()} at {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  </NotificationCardLink>

                  <div className="flex items-start gap-2 shrink-0">
                    {!notification.is_read && (
                      <form action={markNotificationRead.bind(null, notification.id)}>
                        <Button size="sm" variant="ghost" className="hidden sm:inline-flex">
                          Mark Read
                        </Button>
                      </form>
                    )}

                    <form action={deleteNotification.bind(null, notification.id)}>
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
