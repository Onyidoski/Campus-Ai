import type { SupabaseClient } from '@supabase/supabase-js'

export type NotificationInput = {
  user_id: string
  type: 'assignment' | 'class' | 'announcement' | 'campus_announcement' | 'exam'
  title: string
  message: string
  href?: string | null
}

export async function createNotifications(
  supabase: SupabaseClient,
  notifications: NotificationInput[]
) {
  if (notifications.length === 0) return

  const { error } = await supabase
    .from('notifications')
    .insert(notifications)

  if (error) {
    console.error('Notification insert error:', error)
  }
}
