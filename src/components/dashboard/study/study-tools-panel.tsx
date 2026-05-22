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
        iconClass: 'text-slate-700',
    },
    {
        id: 'flashcards' as const,
        title: 'Flashcards',
        description: 'Study key terms and concepts with flip cards',
        icon: Layers,
        iconClass: 'text-slate-700',
    },
    {
        id: 'summary' as const,
        title: 'Summary',
        description: 'Get a comprehensive summary of your course materials',
        icon: FileSearch,
        iconClass: 'text-slate-700',
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
                <Button variant="ghost" size="sm" onClick={() => setMode('menu')} className="gap-1 text-slate-500 hover:text-slate-700 active:scale-[0.98]">
                    <ArrowLeft className="h-4 w-4" /> Back to Study Tools
                </Button>

                <Card className="border-slate-200 shadow-none">
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
        <div className="space-y-5">
            <div className="py-2 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <Brain className="h-7 w-7 text-slate-700" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">AI Study Companion</h3>
                <p className="mt-1 text-sm text-slate-500">Choose a study tool to get started</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {STUDY_TOOLS.map((tool) => (
                    <Card
                        key={tool.id}
                        className="cursor-pointer border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_-18px_rgba(15,23,42,0.28)]"
                        onClick={() => setMode(tool.id)}
                    >
                        <CardContent className="pb-6 pt-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                                <tool.icon className={`h-5 w-5 ${tool.iconClass}`} />
                            </div>
                            <h4 className="font-semibold text-slate-900">{tool.title}</h4>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">{tool.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
