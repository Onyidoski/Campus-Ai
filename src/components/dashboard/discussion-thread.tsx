'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { createReply, deleteReply, toggleAnswered } from '@/app/dashboard/courses/[courseId]/discussions/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Send, Trash2, CheckCircle2 } from 'lucide-react'

interface Reply {
    id: string
    content: string
    is_accepted: boolean
    created_at: string
    profiles: {
        full_name: string
        role: string
    }
    author_id: string
}

interface DiscussionThreadProps {
    postId: string
    courseId: string
    replies: Reply[]
    isLecturer: boolean
    isAnswered: boolean
    currentUserId: string
}

export function DiscussionThread({ postId, courseId, replies: initialReplies, isLecturer, isAnswered, currentUserId }: DiscussionThreadProps) {
    const [loading, setLoading] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const [replies, setReplies] = useState<Reply[]>(initialReplies)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Supabase Realtime subscription for live replies
    useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`discussion-${postId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'discussion_replies',
                    filter: `post_id=eq.${postId}`,
                },
                async (payload) => {
                    // Fetch the full reply with author profile
                    const { data: newReply } = await supabase
                        .from('discussion_replies')
                        .select('*, profiles:author_id(full_name, role)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newReply) {
                        setReplies((prev) => {
                            // Avoid duplicates
                            if (prev.some(r => r.id === newReply.id)) return prev
                            return [...prev, newReply as Reply]
                        })
                        // Auto-scroll to new reply
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'discussion_replies',
                    filter: `post_id=eq.${postId}`,
                },
                (payload) => {
                    setReplies((prev) => prev.filter(r => r.id !== payload.old.id))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [postId])

    const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!replyContent.trim()) return
        setLoading(true)

        const formData = new FormData()
        formData.set('content', replyContent)
        const result = await createReply(formData, postId, courseId)

        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            setReplyContent('')
        }
    }

    const handleToggleAnswered = async () => {
        const result = await toggleAnswered(postId, courseId, isAnswered)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
        }
    }

    return (
        <div className="space-y-6">
            {/* Lecturer Action Bar */}
            {isLecturer && (
                <div className="flex justify-end">
                    <Button
                        variant={isAnswered ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={handleToggleAnswered}
                        className={isAnswered ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}
                    >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {isAnswered ? 'Marked as Answered' : 'Mark as Answered'}
                    </Button>
                </div>
            )}

            {/* Replies List */}
            {replies.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                    <p className="text-sm">No replies yet. Be the first to respond!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {replies.map((reply) => {
                        const date = new Date(reply.created_at)
                        const initial = reply.profiles?.full_name?.charAt(0).toUpperCase() || '?'
                        const isAuthor = reply.author_id === currentUserId

                        return (
                            <div key={reply.id} className="flex gap-3 group animate-[fade-in_0.3s_ease-out]">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${reply.profiles?.role === 'lecturer'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {initial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm text-gray-900">{reply.profiles?.full_name || 'Unknown'}</span>
                                        {reply.profiles?.role === 'lecturer' && (
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                                Lecturer
                                            </Badge>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">
                                        {reply.content}
                                    </p>
                                </div>

                                {isAuthor && (
                                    <form action={deleteReply.bind(null, reply.id, postId, courseId)}>
                                        <Button
                                            type="submit"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete Reply"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </form>
                                )}
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* Reply Input */}
            <form onSubmit={handleReply} className="flex gap-3 items-start border-t pt-4">
                <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                    className="flex-1 resize-none"
                    disabled={loading}
                />
                <Button type="submit" disabled={loading || !replyContent.trim()} size="icon" className="shrink-0 h-10 w-10">
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    )
}
