'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

// --- CREATE DISCUSSION POST ---
export async function createPost(formData: FormData, courseId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const title = formData.get('title') as string
    const content = formData.get('content') as string

    if (!title?.trim()) return { error: 'Title is required.' }
    if (!content?.trim()) return { error: 'Content is required.' }

    const { error } = await supabase
        .from('discussion_posts')
        .insert({
            course_id: courseId,
            author_id: user.id,
            title: title.trim(),
            content: content.trim(),
        })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: 'Question posted!' }
}

// --- CREATE REPLY ---
export async function createReply(formData: FormData, postId: string, courseId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const content = formData.get('content') as string
    if (!content?.trim()) return { error: 'Reply cannot be empty.' }

    const { error } = await supabase
        .from('discussion_replies')
        .insert({
            post_id: postId,
            author_id: user.id,
            content: content.trim(),
        })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/courses/${courseId}/discussions/${postId}`)
    return { success: 'Reply posted!' }
}

// --- DELETE POST ---
export async function deletePost(postId: string, courseId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('discussion_posts')
        .delete()
        .eq('id', postId)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/courses/${courseId}`)
}

// --- DELETE REPLY ---
export async function deleteReply(replyId: string, postId: string, courseId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('discussion_replies')
        .delete()
        .eq('id', replyId)

    if (error) throw new Error(error.message)

    revalidatePath(`/dashboard/courses/${courseId}/discussions/${postId}`)
}

// --- TOGGLE ANSWERED (Lecturer marks a post as resolved) ---
export async function toggleAnswered(postId: string, courseId: string, currentState: boolean) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Verify the user is the course lecturer
    const { data: course } = await supabase
        .from('courses')
        .select('lecturer_id')
        .eq('id', courseId)
        .single()

    if (course?.lecturer_id !== user.id) return { error: 'Only the course lecturer can mark posts as answered.' }

    const { error } = await supabase
        .from('discussion_posts')
        .update({ is_answered: !currentState })
        .eq('id', postId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/courses/${courseId}`)
    revalidatePath(`/dashboard/courses/${courseId}/discussions/${postId}`)
    return { success: !currentState ? 'Marked as answered!' : 'Unmarked.' }
}
