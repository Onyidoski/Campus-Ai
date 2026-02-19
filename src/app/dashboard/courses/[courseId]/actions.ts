'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { uploadToR2 } from '@/utils/r2'
import { embedMany } from 'ai'
import { google } from '@ai-sdk/google'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

// --- HELPER: CHOP TEXT INTO PARAGRAPHS ---
function chunkText(text: string, maxChunkSize: number = 1000) {
  const paragraphs = text.split(/\n\s*\n/)
  const chunks = []
  let currentChunk = ""

  for (const p of paragraphs) {
    if ((currentChunk + p).length > maxChunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      currentChunk = p
    } else {
      currentChunk += "\n\n" + p
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim())

  // Fallback if a single paragraph is somehow insanely long
  return chunks.flatMap(c => c.length > maxChunkSize ? c.match(new RegExp('.{1,' + maxChunkSize + '}', 'g')) || [] : c)
}

// --- UPGRADED MATERIAL UPLOAD ACTION (WITH AI KNOWLEDGE EXTRACTOR) ---
export async function uploadMaterial(formData: FormData, courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  const title = formData.get('title') as string

  if (!file || file.size === 0) return { error: 'No file selected' }

  try {
    // 1. Upload to Cloudflare R2
    const publicUrl = await uploadToR2(file, courseId)
    const fileType = file.type.split('/')[1] || 'unknown'

    // 2. Save to DB and GET the new Material ID
    const { data: material, error: dbError } = await supabase
      .from('materials')
      .insert({
        course_id: courseId,
        uploader_id: user.id,
        title: title,
        file_url: publicUrl,
        file_type: fileType,
      })
      .select('id') // We need this ID to link the AI memory to this specific file!
      .single()

    if (dbError) return { error: dbError.message }

    // ==========================================
    // 3. THE AI KNOWLEDGE EXTRACTOR 🧠
    // Supports: PDF, DOCX
    // ==========================================
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const fileExtension = file.name?.split('.').pop()?.toLowerCase()
    const isSupported = supportedTypes.includes(file.type) || fileExtension === 'docx' || fileExtension === 'pdf'

    if (isSupported) {
      try {
        let text = ''
        const buffer = Buffer.from(await file.arrayBuffer())

        // A. Extract text based on file type
        if (file.type === 'application/pdf' || fileExtension === 'pdf') {
          console.log('📄 AI Extractor: Starting PDF text extraction...')
          const parser = new PDFParse({ data: buffer })
          const textResult = await parser.getText()
          text = textResult.text
          await parser.destroy()
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
          console.log('📄 AI Extractor: Starting DOCX text extraction...')
          const result = await mammoth.extractRawText({ buffer })
          text = result.value
        }

        console.log('📄 AI Extractor: Extracted', text?.length ?? 0, 'characters of text')

        if (text && text.trim().length > 0) {
          // B. Chop it into paragraphs (3000 chars = good balance of context vs count)
          const chunks = chunkText(text, 3000)
          const validChunks = chunks.filter(c => c.trim().length > 0)
          console.log('📄 AI Extractor: Created', validChunks.length, 'text chunks')

          // C. Batch embed in small groups to stay within free tier rate limits
          const BATCH_SIZE = 5 // Small batches to avoid free tier quota
          const DELAY_BETWEEN_BATCHES_MS = 15000 // 15 seconds between batches
          const MAX_RETRIES = 5
          const allEmbeddings: number[][] = []
          const totalBatches = Math.ceil(validChunks.length / BATCH_SIZE)
          console.log(`📄 AI Extractor: Generating embeddings in ${totalBatches} batches (free tier safe mode)...`)

          for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
            // Rate limit delay between batches
            if (i > 0) {
              console.log(`📄 AI Extractor: Waiting ${DELAY_BETWEEN_BATCHES_MS / 1000}s before next batch...`)
              await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS))
            }
            const batch = validChunks.slice(i, i + BATCH_SIZE)
            const batchNum = Math.floor(i / BATCH_SIZE) + 1
            console.log(`📄 AI Extractor: Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)`)

            // Retry with exponential backoff
            let lastError: unknown = null
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
              try {
                const { embeddings } = await embedMany({
                  model: google.textEmbeddingModel('gemini-embedding-001'),
                  values: batch,
                })
                allEmbeddings.push(...embeddings)
                lastError = null
                break // Success, move to next batch
              } catch (err) {
                lastError = err
                const waitTime = Math.pow(2, attempt) * 30000 // 30s, 60s, 120s, 240s, 480s
                console.warn(`⚠️ Batch ${batchNum} attempt ${attempt + 1}/${MAX_RETRIES} failed (rate limit). Retrying in ${waitTime / 1000}s...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
              }
            }
            if (lastError) {
              console.error(`❌ Batch ${batchNum} failed after ${MAX_RETRIES} retries. Skipping remaining batches.`)
              throw lastError
            }
          }
          console.log('📄 AI Extractor: Generated', allEmbeddings.length, 'embeddings, dimension:', allEmbeddings[0]?.length)

          // D. Batch insert into Supabase
          let totalInserted = 0
          for (let i = 0; i < validChunks.length; i += BATCH_SIZE) {
            const batchChunks = validChunks.slice(i, i + BATCH_SIZE)
            const batchEmbeddings = allEmbeddings.slice(i, i + BATCH_SIZE)
            const embeddingsToInsert = batchChunks.map((chunk, j) => ({
              course_id: courseId,
              material_id: material.id,
              content: chunk,
              embedding: batchEmbeddings[j]
            }))

            const { error: vectorError } = await supabase
              .from('material_embeddings')
              .insert(embeddingsToInsert)

            if (vectorError) {
              console.error(`❌ Vector DB Insert Error (batch ${Math.floor(i / BATCH_SIZE) + 1}):`, vectorError)
            } else {
              totalInserted += embeddingsToInsert.length
            }
          }
          console.log(`✅ AI Extractor: Successfully stored ${totalInserted}/${validChunks.length} embeddings!`)
        } else {
          console.log('⚠️ AI Extractor: No text found in document (might be a scanned/image file)')
        }
      } catch (aiError) {
        console.error("❌ AI Extraction Error:", aiError)
        // Note: If the AI fails, we don't crash the upload.
        // The file still uploads, it just won't be searchable by the AI.
      }
    }
    // ==========================================

    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: 'Material uploaded successfully!' }

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
export async function deleteMaterial(materialId: string, courseId: string, formData?: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', materialId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/courses/${courseId}`)
}

export async function deleteAssignment(assignmentId: string, courseId: string, formData?: FormData) {
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

  const updateData: any = {
    title,
    description,
    due_date: new Date(dueDate).toISOString(),
  }

  if (file && file.size > 0) {
    try {
      const attachmentUrl = await uploadToR2(file, `${courseId}/assignments`)
      updateData.attachment_url = attachmentUrl
    } catch (error) {
      console.error("Attachment Upload Error:", error)
      return { error: 'Failed to upload new attachment.' }
    }
  }

  const { error } = await supabase
    .from('assignments')
    .update(updateData)
    .eq('id', assignmentId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: 'Assignment updated successfully!' }
}

// --- STUDENT SUBMISSION ACTION ---
export async function submitAssignment(formData: FormData, assignmentId: string, courseId: string) {
  const supabase = await createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Extract File
  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Please select a file to submit.' }

  try {
    // 3. Upload to Cloudflare R2
    const fileUrl = await uploadToR2(file, `${courseId}/submissions/${assignmentId}`)

    // 4. Check if student already has a submission for this assignment
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single()

    if (existingSubmission) {
      // UPDATE existing submission
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ file_url: fileUrl, submitted_at: new Date().toISOString() })
        .eq('id', existingSubmission.id)

      if (updateError) return { error: updateError.message }
    } else {
      // INSERT new submission
      const { error: insertError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: user.id,
          file_url: fileUrl,
        })

      if (insertError) return { error: insertError.message }
    }

    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: 'Work submitted successfully!' }

  } catch (error) {
    console.error("Submission Upload Error:", error)
    return { error: 'Failed to submit work. Please try again.' }
  }
}

// --- GRADE SUBMISSION ACTION (LECTURERS) ---
export async function gradeSubmission(formData: FormData, submissionId: string, courseId: string, assignmentId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const grade = formData.get('grade') as string
  const feedback = formData.get('feedback') as string

  if (!grade) return { error: 'A grade is required.' }

  const { error } = await supabase
    .from('submissions')
    .update({ grade, feedback })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/courses/${courseId}/assignments/${assignmentId}`)
  return { success: 'Grade saved successfully!' }
}

// --- ANNOUNCEMENTS ACTIONS ---
export async function createAnnouncement(formData: FormData, courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const content = formData.get('content') as string
  const isUrgent = formData.get('isUrgent') === 'on' // Checkbox returns 'on' if checked

  if (!content.trim()) return { error: 'Announcement cannot be empty.' }

  const { error } = await supabase
    .from('announcements')
    .insert({
      course_id: courseId,
      lecturer_id: user.id,
      content,
      is_urgent: isUrgent
    })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/courses/${courseId}`)
  return { success: 'Announcement posted!' }
}

export async function deleteAnnouncement(announcementId: string, courseId: string, formData?: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (error) throw new Error(error.message)

  revalidatePath(`/dashboard/courses/${courseId}`)
}