import { deleteAnnouncement } from '@/app/dashboard/courses/[courseId]/actions'
import { AddAnnouncementDialog } from '@/components/dashboard/add-announcement-dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Megaphone, MessageSquare, Trash2 } from 'lucide-react'

type Announcement = {
  id: string
  content: string
  is_urgent: boolean
  created_at: string
  profiles?: { full_name?: string | null } | null
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function formatStreamDate(dateValue: string) {
  const date = new Date(dateValue)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffHours < 1) return `Just now · ${time}`
  if (diffHours < 24) return `Today · ${time}`
  if (diffDays === 1) return `Yesterday · ${time}`
  if (diffDays < 7) return `${diffDays}d ago · ${time}`
  return `${date.toLocaleDateString()} · ${time}`
}

export function CourseStreamTab({
  announcements,
  courseId,
  isLecturer,
}: {
  announcements: Announcement[]
  courseId: string
  isLecturer: boolean
}) {
  const urgentCount = announcements.filter((item) => item.is_urgent).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Class Stream</h3>
          <p className="mt-1 text-sm text-slate-500">
            {announcements.length} update{announcements.length === 1 ? '' : 's'}
            {urgentCount > 0 ? ` · ${urgentCount} urgent` : ''}
          </p>
        </div>
        {isLecturer && <AddAnnouncementDialog courseId={courseId} />}
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-900">No announcements yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {isLecturer
                ? 'Post the first update for your class.'
                : 'Your lecturer has not posted any updates yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {announcements.map((announcement, index) => {
            const authorName = announcement.profiles?.full_name || 'Lecturer'
            const isLast = index === announcements.length - 1

            return (
              <article
                key={announcement.id}
                className={`px-4 py-5 sm:px-5 ${!isLast ? 'border-b border-slate-100' : ''} ${
                  announcement.is_urgent ? 'bg-rose-50/40' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                      announcement.is_urgent
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {getInitials(authorName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{authorName}</p>
                          {announcement.is_urgent && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                              <AlertCircle className="h-3 w-3" />
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatStreamDate(announcement.created_at)}
                        </p>
                      </div>

                      {isLecturer && (
                        <form action={deleteAnnouncement.bind(null, announcement.id, courseId)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <div className="mt-1 shrink-0 text-slate-400">
                        {announcement.is_urgent ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Megaphone className="h-4 w-4" />
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {announcement.content}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
