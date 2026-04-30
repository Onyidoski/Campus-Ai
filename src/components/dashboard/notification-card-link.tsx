'use client'

import { useRef } from 'react'
import { openNotificationFromForm } from '@/app/dashboard/notifications/actions'

export function NotificationCardLink({
  notificationId,
  href,
  children,
  className,
}: {
  notificationId: string
  href: string
  children: React.ReactNode
  className?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={openNotificationFromForm} className={className}>
      <input type="hidden" name="notificationId" value={notificationId} />
      <input type="hidden" name="href" value={href} />
      <button
        type="submit"
        className="block w-full cursor-pointer text-left"
        aria-label="Open notification"
      >
        {children}
      </button>
    </form>
  )
}
