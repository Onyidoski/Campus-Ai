'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Brain, ClipboardList, Layers, FileSearch } from 'lucide-react'
import { QuizMode } from '@/components/dashboard/study/quiz-mode'
import { FlashcardMode } from '@/components/dashboard/study/flashcard-mode'
import { SummaryMode } from '@/components/dashboard/study/summary-mode'
import { AITutorSheet } from '@/components/dashboard/ai-tutor-sheet'

type StudyMode = 'menu' | 'quiz' | 'flashcards' | 'summary'

export interface CourseMaterial {
    id: string
    title: string
    file_name: string
}

const STUDY_TOOLS = [
    {
        id: 'quiz' as const,
        title: 'Quiz Me',
        description: 'Test your knowledge with AI-generated multiple choice questions',
        icon: ClipboardList,
        gradient: 'from-indigo-500 to-violet-500',
        bg: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
    },
    {
        id: 'flashcards' as const,
        title: 'Flashcards',
        description: 'Study key terms and concepts with flip cards',
        icon: Layers,
        gradient: 'from-amber-500 to-orange-500',
        bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    },
    {
        id: 'summary' as const,
        title: 'Summary',
        description: 'Get a comprehensive summary of your course materials',
        icon: FileSearch,
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    },
]

export function StudyToolsPanel({ courseId, materials }: { courseId: string; materials: CourseMaterial[] }) {
    const [mode, setMode] = useState<StudyMode>('menu')
    const [tutorOpen, setTutorOpen] = useState(false)
    const [tutorMessage, setTutorMessage] = useState<string | undefined>()

    const handleAskTutor = (message: string) => {
        setTutorMessage(message)
        setTutorOpen(true)
    }

    // --- STUDY MODE SELECTED ---
    if (mode !== 'menu') {
        return (
            <div className="space-y-4">
                <Button variant="ghost" size="sm" onClick={() => setMode('menu')} className="gap-1 text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Study Tools
                </Button>

                <Card>
                    <CardContent className="pt-6">
                        {mode === 'quiz' && <QuizMode courseId={courseId} materials={materials} onAskTutor={handleAskTutor} />}
                        {mode === 'flashcards' && <FlashcardMode courseId={courseId} materials={materials} />}
                        {mode === 'summary' && <SummaryMode courseId={courseId} materials={materials} />}
                    </CardContent>
                </Card>

                {/* AI Tutor Sheet — controlled by quiz "Explain This" button */}
                <AITutorSheet
                    courseId={courseId}
                    initialMessage={tutorMessage}
                    externalOpen={tutorOpen}
                    onOpenChange={(open) => {
                        setTutorOpen(open)
                        if (!open) setTutorMessage(undefined)
                    }}
                />
            </div>
        )
    }

    // --- MENU ---
    return (
        <div className="space-y-4">
            <div className="text-center py-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Brain className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI Study Companion</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a study tool to get started</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {STUDY_TOOLS.map((tool) => (
                    <Card
                        key={tool.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${tool.bg}`}
                        onClick={() => setMode(tool.id)}
                    >
                        <CardContent className="pt-6 pb-5 text-center">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                                <tool.icon className="h-6 w-6 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900">{tool.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tool.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
