import { createClient } from '@/utils/supabase/server'
import { generateText, embed } from 'ai'
import { google } from '@ai-sdk/google'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    const { courseId, mode, topic, materialId, difficulty } = await req.json()

    if (!courseId || !mode) {
        return NextResponse.json({ error: 'courseId and mode are required.' }, { status: 400 })
    }

    let contextText = ''

    if (materialId) {
        // Material-specific mode: fetch all embeddings from this specific PDF
        const { data: chunks, error: chunkError } = await supabase
            .from('material_embeddings')
            .select('content')
            .eq('material_id', materialId)
            .limit(20)

        if (chunkError) {
            console.error('Material embeddings fetch error:', chunkError)
            return NextResponse.json({ error: 'Failed to fetch material content.' }, { status: 500 })
        }

        if (!chunks || chunks.length === 0) {
            return NextResponse.json({
                error: 'No embedded content found for this material. The PDF may not have been processed yet.'
            }, { status: 404 })
        }

        contextText = chunks.map((c: any) => c.content).join('\n\n---\n\n')
    } else {
        // Course-wide mode: vector search across all materials
        // 1. Build a search query based on mode and optional topic
        const searchQuery = topic
            ? `${topic}`
            : mode === 'quiz'
                ? 'key concepts definitions important topics exam questions'
                : mode === 'flashcards'
                    ? 'key terms definitions vocabulary concepts'
                    : 'main topics overview summary key takeaways'

        // 2. Embed the search query
        const { embedding } = await embed({
            model: google.textEmbeddingModel('gemini-embedding-001'),
            value: searchQuery,
        })

        // 3. Vector search for relevant course content
        const { data: matchedContext, error } = await supabase.rpc('match_material_embeddings', {
            query_embedding: embedding,
            match_threshold: 0.2,
            match_count: 10,
            filter_course_id: courseId,
        })

        if (error) {
            console.error('Vector search error:', error)
            return NextResponse.json({ error: 'Failed to search course materials.' }, { status: 500 })
        }

        if (!matchedContext || matchedContext.length === 0) {
            return NextResponse.json({
                error: 'No course materials found. Ask your lecturer to upload some materials first!'
            }, { status: 404 })
        }

        contextText = matchedContext.map((m: any) => m.content).join('\n\n---\n\n')
    }

    // 4. Clean the content — remove scanner watermarks, artifacts, and noise
    contextText = contextText
        // Remove CamScanner and similar scanner watermarks
        .replace(/cam\s*scanner/gi, '')
        .replace(/scanned\s*(with|by|using)\s*\w+/gi, '')
        .replace(/adobe\s*scan/gi, '')
        .replace(/microsoft\s*lens/gi, '')
        .replace(/genius\s*scan/gi, '')
        // Remove common PDF artifacts
        .replace(/www\.\S+/g, '')  // URLs in watermarks
        .replace(/https?:\/\/\S+/g, '')
        // Remove page number patterns
        .replace(/^\s*page\s*\d+\s*(of\s*\d+)?\s*$/gim, '')
        .replace(/^\s*\d+\s*$/gm, '') // Standalone numbers (page numbers)
        // Clean up excessive whitespace left behind
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    // 5. Generate content based on mode
    const ignoreNoiseInstruction = 'IMPORTANT: Focus ONLY on the actual academic/educational content. Completely ignore any scanner watermarks, app names (like CamScanner), page numbers, headers/footers, or other PDF artifacts that are not part of the course material.'

    // Difficulty instruction for quizzes
    const difficultyLevel = difficulty || 'medium'
    const difficultyInstruction = difficultyLevel === 'easy'
        ? 'DIFFICULTY: Easy — Focus on basic recall, definitions, and straightforward facts. Questions should be answerable by someone who has read the material once.'
        : difficultyLevel === 'hard'
            ? 'DIFFICULTY: Hard — Focus on analysis, edge cases, comparing concepts, and applying knowledge to new scenarios. Questions should challenge students who know the material well.'
            : 'DIFFICULTY: Medium — Focus on understanding and application. Questions should test whether the student truly understands the concepts, not just memorized them.'

    let systemPrompt = ''

    if (mode === 'quiz') {
        systemPrompt = `You are an expert university quiz generator. Based on the course material provided, generate a quiz of exactly 5 multiple-choice questions.

${ignoreNoiseInstruction}

${difficultyInstruction}

COURSE MATERIAL:
${contextText}

RULES:
1. Questions should test understanding, not just memorization.
2. Each question must have exactly 4 options labeled A, B, C, D.
3. Provide the correct answer letter and a brief explanation for each.
4. Make questions progressively harder.
${topic ? `5. Focus the questions on the topic: "${topic}"` : '5. Cover a variety of topics from the material.'}

You MUST respond ONLY with valid JSON in this exact format, no markdown fences:
{"questions":[{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}]}`
    } else if (mode === 'flashcards') {
        systemPrompt = `You are an expert study flashcard creator. Based on the course material provided, generate exactly 8 flashcards.

${ignoreNoiseInstruction}

COURSE MATERIAL:
${contextText}

RULES:
1. Each flashcard should have a clear "front" (question/term) and "back" (answer/definition).
2. Cover the most important concepts, terms, and definitions.
3. Keep each side concise but informative — 1 to 3 sentences max.
${topic ? `4. Focus the cards on the topic: "${topic}"` : '4. Cover a variety of topics from the material.'}

You MUST respond ONLY with valid JSON in this exact format, no markdown fences:
{"cards":[{"front":"...","back":"..."}]}`
    } else if (mode === 'summary') {
        systemPrompt = `You are an expert academic summarizer. Based on the course material provided, generate a comprehensive study summary.

${ignoreNoiseInstruction}

COURSE MATERIAL:
${contextText}

RULES:
1. Organize the summary with clear headings and sections.
2. Highlight key concepts, definitions, and important relationships.
3. Use bullet points for clarity.
4. Include a "Key Takeaways" section at the end.
5. Make it easy for a student to review before an exam.
${topic ? `6. Focus specifically on: "${topic}"` : ''}

Respond in well-formatted markdown.`
    } else {
        return NextResponse.json({ error: 'Invalid mode. Use: quiz, flashcards, or summary.' }, { status: 400 })
    }

    try {
        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            prompt: `Generate the ${mode} content now.`,
        })

        // For quiz and flashcards, parse JSON. For summary, return raw text.
        if (mode === 'summary') {
            return NextResponse.json({ content: text })
        }

        // Robust JSON extraction: find the JSON object in the response
        // Gemini sometimes wraps JSON in markdown fences, adds preamble text, etc.
        let jsonStr = ''

        // Strategy 1: Try to extract JSON between markdown fences
        const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
        if (fenceMatch) {
            jsonStr = fenceMatch[1].trim()
        } else {
            // Strategy 2: Find the first { and last } to extract the JSON object
            const firstBrace = text.indexOf('{')
            const lastBrace = text.lastIndexOf('}')
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonStr = text.substring(firstBrace, lastBrace + 1)
            } else {
                jsonStr = text.trim()
            }
        }

        try {
            const parsed = JSON.parse(jsonStr)
            return NextResponse.json(parsed)
        } catch (parseErr) {
            console.error('Failed to parse AI response as JSON.')
            console.error('Raw response length:', text.length)
            console.error('Extracted JSON (first 500 chars):', jsonStr.substring(0, 500))
            console.error('Parse error:', parseErr)
            return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 })
        }
    } catch (err: any) {
        console.error('AI generation error:', err)
        return NextResponse.json({ error: err.message || 'Failed to generate content.' }, { status: 500 })
    }
}
