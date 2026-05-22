import Link from 'next/link'
import { CreatePostDialog } from '@/components/dashboard/create-post-dialog'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, HelpCircle, MessageSquare } from 'lucide-react'

type DiscussionPost = {
  id: string
  title: string
  content: string
  is_answered: boolean
  created_at: string
  profiles?: { full_name?: string | null; role?: string | null } | null
  discussion_replies?: { count: number }[] | null
}

function getInitials(name?: string | null) {
  if (!name) return '?'
  return name.trim().charAt(0).toUpperCase()
}

export function CourseDiscussionsTab({
  posts,
  courseId,
}: {
  posts: DiscussionPost[]
  courseId: string
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Course Discussions</h3>
          <p className="mt-1 text-sm text-slate-500">
            {posts.length} topic{posts.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <CreatePostDialog courseId={courseId} />
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <HelpCircle className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-900">No discussions yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Be the first to ask a question or start a topic.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const date = new Date(post.created_at)
            const replyCount = post.discussion_replies?.[0]?.count || 0
            const authorName = post.profiles?.full_name || 'Unknown'
            const isLecturer = post.profiles?.role === 'lecturer'

            return (
              <Link
                key={post.id}
                href={`/dashboard/courses/${courseId}/discussions/${post.id}`}
                className="block min-w-0"
              >
                <article className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                        isLecturer
                          ? 'border-blue-200 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-slate-100 text-slate-700'
                      }`}
                    >
                      {getInitials(authorName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="min-w-0 text-base font-semibold text-slate-900 sm:line-clamp-1">
                          {post.title}
                        </h4>
                        {post.is_answered && (
                          <Badge className="shrink-0 border-green-200 bg-green-50 px-1.5 py-0 text-[10px] text-green-700 hover:bg-green-50">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Answered
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600 sm:line-clamp-1">
                        {post.content}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="max-w-[140px] truncate sm:max-w-none">{authorName}</span>
                        <span className="hidden sm:inline" aria-hidden>
                          •
                        </span>
                        <span className="whitespace-nowrap">{date.toLocaleDateString()}</span>
                        <span aria-hidden>•</span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <MessageSquare className="h-3 w-3 shrink-0" />
                          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
