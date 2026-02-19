import { createClient } from '@/utils/supabase/server'
import { streamText, embed } from 'ai'
import { google } from '@ai-sdk/google'

// Allow responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const supabase = await createClient()

    // Extract the chat history and the current course ID from the frontend
    const { messages, courseId } = await req.json()

    // 1. Get the user's latest question
    const latestMessage = messages[messages.length - 1].content

    // 2. Turn the student's question into mathematical vectors
    const { embedding } = await embed({
        model: google.textEmbeddingModel('text-embedding-004'),
        value: latestMessage,
    })

    // 3. Search Supabase for the most relevant paragraphs uploaded by the lecturer
    const { data: matchedContext, error } = await supabase.rpc('match_material_embeddings', {
        query_embedding: embedding,
        match_threshold: 0.3,     // How strict the match should be (0.3 is a good balance)
        match_count: 5,           // Grab the 5 most relevant paragraphs
        filter_course_id: courseId // ONLY search materials from this specific course!
    })

    if (error) console.error("Vector Search Error:", error)

    // 4. Combine all the found paragraphs into one giant reference text
    let contextText = ""
    if (matchedContext && matchedContext.length > 0) {
        contextText = matchedContext.map((match: any) => match.content).join('\n\n---\n\n')
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

    // 6. Generate the streaming response using Gemini 1.5 Flash (Super fast!)
    const result = streamText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        messages,
    })

    // 7. Stream the text back to the UI in real-time
    return result.toUIMessageStreamResponse()
}