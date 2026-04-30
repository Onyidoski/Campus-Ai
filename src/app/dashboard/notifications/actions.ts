'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id }
}

export async function markNotificationRead(notificationId: string) {
  const { supabase, userId } = await getUserId()
  if (!userId) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
}

export async function markAllNotificationsRead() {
  const { supabase, userId } = await getUserId()
  if (!userId) return

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
}

export async function deleteNotification(notificationId: string) {
  const { supabase, userId } = await getUserId()
  if (!userId) return

  await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
}

export async function openNotification(notificationId: string, href: string) {
  const { supabase, userId } = await getUserId()
  if (!userId) redirect('/login')

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard')
  redirect(href || '/dashboard/notifications')
}

export async function openNotificationFromForm(formData: FormData) {
  const notificationId = formData.get('notificationId') as string
  const href = formData.get('href') as string

  if (!notificationId) redirect('/dashboard/notifications')
  await openNotification(notificationId, href || '/dashboard/notifications')
}
