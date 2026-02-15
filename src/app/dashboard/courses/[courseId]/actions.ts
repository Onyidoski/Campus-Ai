'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { uploadToR2 } from '@/utils/r2'

// --- MATERIAL UPLOAD ACTION ---
export async function uploadMaterial(formData: FormData, courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  const title = formData.get('title') as string

  if (!file || file.size === 0) return { error: 'No file selected' }

  try {
    const publicUrl = await uploadToR2(file, courseId)

    const { error: dbError } = await supabase
      .from('materials')
      .insert({
        course_id: courseId,
        uploader_id: user.id,
        title: title,
        file_url: publicUrl,
        file_type: file.type.split('/')[1] || 'unknown',
      })

    if (dbError) return { error: dbError.message }

    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: 'Material uploaded to R2 successfully!' }

  } catch (error) {
    console.error("Upload Error:", error)
    return { error: 'Failed to upload material. Please try again.' }
  }
}

// --- ASSIGNMENT CREATION ACTION ---
export async function createAssignment(formData: FormData, courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('dueDate') as string
  const file = formData.get('file') as File | null

  if (!title || !dueDate) return { error: 'Title and Due Date are required' }

  let attachmentUrl = null
  if (file && file.size > 0) {
    try {
      attachmentUrl = await uploadToR2(file, `${courseId}/assignments`)
    } catch (error) {
      console.error("Attachment Upload Error:", error)
      return { error: 'Failed to upload attachment. Please try again.' }
    }
  }

  const { error } = await supabase
    .from('assignments')
    .insert({
      course_id: courseId,
      title,
      description,
      due_date: new Date(dueDate).toISOString(),
      attachment_url: attachmentUrl,
    })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: 'Assignment created successfully!' }
}

// --- DELETE ACTIONS ---

export async function deleteMaterial(materialId: string, courseId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/courses/${courseId}`)
}

export async function deleteAssignment(assignmentId: string, courseId: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/courses/${courseId}`)
}

// --- EDIT ACTIONS ---

export async function editAssignment(formData: FormData, assignmentId: string, courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const dueDate = formData.get('dueDate') as string
  const file = formData.get('file') as File | null

  if (!title || !dueDate) return { error: 'Title and Due Date are required' }

  // Start building the update object
  const updateData: any = {
    title,
    description,
    due_date: new Date(dueDate).toISOString(),
  }

  // If they uploaded a NEW file, upload it to R2 and update the URL
  if (file && file.size > 0) {
    try {
      const attachmentUrl = await uploadToR2(file, `${courseId}/assignments`)
      updateData.attachment_url = attachmentUrl
    } catch (error) {
      console.error("Attachment Upload Error:", error)
      return { error: 'Failed to upload new attachment.' }
    }
  }

  // Update the database
  const { error } = await supabase
    .from('assignments')
    .update(updateData)
    .eq('id', assignmentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: 'Assignment updated successfully!' }
}