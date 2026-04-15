import { createClient } from '@/utils/supabase/server'
import { streamText, embed, convertToModelMessages } from 'ai'
import { google } from '@ai-sdk/google'

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const supabase = await createClient()

    // Extract the chat history and the current course ID from the frontend
    const body = await req.json()
    const { messages, courseId, materialId } = body

    console.log('📨 Chat API called. courseId:', courseId, 'materialId:', materialId)
    console.log('📨 Body keys:', Object.keys(body))

    // 1. Get the user's latest question (v6 uses parts array, not content string)
    const lastMessage = messages[messages.length - 1]
    const latestMessage = lastMessage.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('') || ''

    console.log('❓ Latest message:', latestMessage)

    // 4. Combine all the found paragraphs into one giant reference text
    let contextText = ""

    if (materialId) {
        // Material-specific mode: fetch all embeddings from this specific PDF
        const { data: chunks, error: chunkError } = await supabase
            .from('material_embeddings')
            .select('content')
            .eq('material_id', materialId)
            .limit(20)

        console.log('📄 Material-specific search:', chunks?.length ?? 0, 'chunks')
        if (chunkError) console.error("❌ Material fetch error:", chunkError)

        if (chunks && chunks.length > 0) {
            contextText = chunks.map((c: any) => c.content).join('\n\n---\n\n')
        }
    } else {
        // 2. Turn the student's question into mathematical vectors
        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: latestMessage,
        })

        console.log('🔢 Embedding dimensions:', embedding.length)

        // 3. Search Supabase for the most relevant paragraphs uploaded by the lecturer
        const { data: matchedContext, error } = await supabase.rpc('match_material_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.3,
            match_count: 5,
            filter_course_id: courseId
        })

        console.log('🔍 Vector search results:', matchedContext?.length ?? 0, 'matches')
        if (error) console.error("❌ Vector Search Error:", error)
        if (matchedContext) console.log('📄 First match preview:', matchedContext[0]?.content?.substring(0, 100))

        if (matchedContext && matchedContext.length > 0) {
            contextText = matchedContext.map((match: any) => match.content).join('\n\n---\n\n')
        }
    }

    // 5. Create the System Prompt (This is the AI's secret instruction manual)
    const systemPrompt = `You are a helpful, encouraging, and brilliant university teaching assistant named Campus AI. 
You are currently helping a student with their coursework.

Below is the context extracted from the lecturer's uploaded course materials. 
Your job is to answer the student's questions using ONLY this context.

COURSE MATERIALS CONTEXT:
${contextText || "No specific course materials found for this question."}

RULES:
1. If the answer is in the context, provide a clear, easy-to-understand explanation.
2. If the answer is NOT in the context, politely inform the student that you cannot find the exact answer in the lecturer's notes, but provide a helpful, scientifically/academically accurate general answer anyway.
3. Format your answers beautifully using markdown (bolding, bullet points, etc.) to make it easy for a student to read.`

    // 6. Convert UIMessages to model messages and generate the streaming response
    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages: modelMessages,
    })

    // 7. Stream the text back to the UI in real-time
    return result.toUIMessageStreamResponse()
}