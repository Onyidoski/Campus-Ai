import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, MessageSquare, Trash2 } from 'lucide-react'
import { DiscussionThread } from '@/components/dashboard/discussion-thread'
import { deletePost } from '../actions'

export default async function DiscussionPostPage({
    params,
}: {
    params: Promise<{ courseId: string; postId: string }> | { courseId: string; postId: string }
}) {
    const supabase = await createClient()
    const resolvedParams = await params
    const { courseId, postId } = resolvedParams

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Fetch the post with author info
    const { data: post, error } = await supabase
        .from('discussion_posts')
        .select('*, profiles:author_id(full_name, role)')
        .eq('id', postId)
        .single()

    if (error || !post) notFound()

    // 3. Fetch course to check if user is lecturer
    const { data: course } = await supabase
        .from('courses')
        .select('lecturer_id, title, code')
        .eq('id', courseId)
        .single()

    const isLecturer = course?.lecturer_id === user.id
    const isPostAuthor = post.author_id === user.id

    // 4. Fetch replies with author info
    const { data: replies } = await supabase
        .from('discussion_replies')
        .select('*, profiles:author_id(full_name, role)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    const postDate = new Date(post.created_at)
    const initial = post.profiles?.full_name?.charAt(0).toUpperCase() || '?'

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Back Navigation */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/courses/${courseId}?tab=discussions`}>
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to {course?.code || 'Course'}
                    </Link>
                </Button>
            </div>

            {/* Post Card */}
            <Card className={`overflow-hidden ${post.is_answered ? 'border-l-4 border-l-green-500' : ''}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${post.profiles?.role === 'lecturer'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                                }`}>
                                {initial}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-sm">{post.profiles?.full_name || 'Unknown'}</span>
                                    {post.profiles?.role === 'lecturer' && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                            Lecturer
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {postDate.toLocaleDateString()} at {postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {post.is_answered && (
                                <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                                    <CheckCircle2 className="mr-1 h-3 w-3" /> Answered
                                </Badge>
                            )}
                            {isPostAuthor && (
                                <form action={deletePost.bind(null, postId, courseId)}>
                                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" title="Delete Post">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{post.title}</h1>
                        <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Replies Section */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-500" />
                    <h2 className="font-semibold text-gray-900">
                        {replies?.length || 0} {replies?.length === 1 ? 'Reply' : 'Replies'}
                    </h2>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <DiscussionThread
                            postId={postId}
                            courseId={courseId}
                            replies={replies || []}
                            isLecturer={isLecturer}
                            isAnswered={post.is_answered}
                            currentUserId={user.id}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
