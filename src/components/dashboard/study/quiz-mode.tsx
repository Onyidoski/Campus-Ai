'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Loader2, Sparkles, MessageSquare, Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import type { CourseMaterial } from '@/components/dashboard/study/study-tools-panel'

interface Question {
    question: string
    options: string[]
    correct: string
    explanation: string
}

interface QuizScore {
    id: string
    score: number
    total: number
    difficulty: string
    created_at: string
}

type Difficulty = 'easy' | 'medium' | 'hard'

export function QuizMode({ courseId, materials, onAskTutor }: {
    courseId: string
    materials: CourseMaterial[]
    onAskTutor?: (message: string) => void
}) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [selected, setSelected] = useState<string | null>(null)
    const [showResult, setShowResult] = useState(false)
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [topic, setTopic] = useState('')
    const [selectedMaterial, setSelectedMaterial] = useState<string>('all')
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')
    const [recentScores, setRecentScores] = useState<QuizScore[]>([])

    // Fetch recent scores on mount
    useEffect(() => {
        const fetchScores = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('quiz_scores')
                .select('id, score, total, difficulty, created_at')
                .eq('course_id', courseId)
                .order('created_at', { ascending: false })
                .limit(5)
            if (data) setRecentScores(data)
        }
        fetchScores()
    }, [courseId, finished])

    const generateQuiz = async () => {
        setLoading(true)
        setError('')
        setQuestions([])
        setCurrentIdx(0)
        setSelected(null)
        setShowResult(false)
        setScore(0)
        setFinished(false)

        try {
            const res = await fetch('/api/study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    mode: 'quiz',
                    topic: topic || undefined,
                    materialId: selectedMaterial !== 'all' ? selectedMaterial : undefined,
                    difficulty,
                }),
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)
            if (!data.questions?.length) throw new Error('No questions generated.')

            setQuestions(data.questions)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleAnswer = (optionLetter: string) => {
        if (showResult) return
        setSelected(optionLetter)
        setShowResult(true)
        if (optionLetter === questions[currentIdx].correct) {
            setScore(prev => prev + 1)
        }
    }

    const handleNext = async () => {
        if (currentIdx + 1 >= questions.length) {
            setFinished(true)
            // Save score to database
            const finalScore = selected === questions[currentIdx].correct ? score + 1 : score
            // Wait for score state to be correct — use computed value
            const supabase = createClient()
            await supabase.from('quiz_scores').insert({
                course_id: courseId,
                material_id: selectedMaterial !== 'all' ? selectedMaterial : null,
                score: finalScore,
                total: questions.length,
                difficulty,
            })
        } else {
            setCurrentIdx(prev => prev + 1)
            setSelected(null)
            setShowResult(false)
        }
    }

    const getOptionLetter = (option: string) => option.charAt(0)

    const difficultyColors = {
        easy: 'bg-green-100 text-green-700 border-green-300',
        medium: 'bg-amber-100 text-amber-700 border-amber-300',
        hard: 'bg-red-100 text-red-700 border-red-300',
    }

    // --- EMPTY STATE ---
    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5 shadow-sm">
                    <Sparkles className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Quiz Generator</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                    Generate practice questions from your course materials to test your knowledge.
                </p>
                <div className="w-full max-w-sm space-y-3">
                    {materials.length > 0 && (
                        <div className="space-y-1.5 text-left">
                            <Label className="text-xs text-gray-500">Source Material</Label>
                            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All course materials" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All course materials</SelectItem>
                                    {materials.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>{m.title || m.file_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Difficulty Selector */}
                    <div className="space-y-1.5 text-left">
                        <Label className="text-xs text-gray-500">Difficulty</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDifficulty(d)}
                                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all capitalize ${difficulty === d
                                            ? difficultyColors[d]
                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {d === 'easy' ? '🟢 Easy' : d === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Input
                        placeholder="Optional: focus on a specific topic..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={loading}
                    />
                    <Button onClick={generateQuiz} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Quiz'}
                    </Button>
                </div>

                {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

                {/* Recent Scores */}
                {recentScores.length > 0 && (
                    <div className="w-full max-w-sm mt-8 text-left">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <h4 className="text-sm font-semibold text-gray-700">Recent Scores</h4>
                        </div>
                        <div className="space-y-2">
                            {recentScores.map((s) => (
                                <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${difficultyColors[s.difficulty as Difficulty] || ''}`}>
                                            {s.difficulty}
                                        </span>
                                        <span className="text-sm font-medium text-gray-700">{s.score}/{s.total}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(s.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // --- FINISHED STATE ---
    if (finished) {
        const percentage = Math.round((score / questions.length) * 100)
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-4 ${percentage >= 80 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                    <span className={`text-3xl font-bold ${percentage >= 80 ? 'text-green-700' : percentage >= 50 ? 'text-yellow-700' : 'text-red-700'
                        }`}>
                        {percentage}%
                    </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                    {percentage >= 80 ? '🎉 Excellent!' : percentage >= 50 ? '👍 Good effort!' : '📚 Keep studying!'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    You scored {score} out of {questions.length}
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded capitalize ${difficultyColors[difficulty]}`}>{difficulty}</span>
                </p>
                <p className="text-xs text-green-600 mt-2">✓ Score saved</p>
                <Button onClick={generateQuiz} variant="outline" className="gap-2 mt-4">
                    <RotateCcw className="h-4 w-4" /> Generate New Quiz
                </Button>
            </div>
        )
    }

    // --- QUIZ IN PROGRESS ---
    const q = questions[currentIdx]
    const isWrong = showResult && selected !== q.correct

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Question {currentIdx + 1} of {questions.length}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${difficultyColors[difficulty]}`}>{difficulty}</span>
                    <Badge variant="outline" className="text-xs">Score: {score}/{questions.length}</Badge>
                </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
            </div>

            {/* Question */}
            <h3 className="text-lg font-semibold text-gray-900 leading-relaxed">{q.question}</h3>

            {/* Options */}
            <div className="space-y-3">
                {q.options.map((option) => {
                    const letter = getOptionLetter(option)
                    const isCorrect = letter === q.correct
                    const isSelected = letter === selected

                    let cardClass = 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer'
                    if (showResult) {
                        if (isCorrect) cardClass = 'border-green-400 bg-green-50'
                        else if (isSelected) cardClass = 'border-red-400 bg-red-50'
                        else cardClass = 'border-gray-100 opacity-50'
                    } else if (isSelected) {
                        cardClass = 'border-indigo-400 bg-indigo-50'
                    }

                    return (
                        <Card
                            key={letter}
                            className={`transition-all duration-200 ${cardClass}`}
                            onClick={() => handleAnswer(letter)}
                        >
                            <CardContent className="py-3 px-4 flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${showResult && isCorrect ? 'bg-green-200 text-green-800' :
                                        showResult && isSelected ? 'bg-red-200 text-red-800' :
                                            'bg-gray-100 text-gray-600'
                                    }`}>
                                    {showResult && isCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                                        showResult && isSelected ? <XCircle className="h-4 w-4" /> :
                                            letter}
                                </div>
                                <span className="text-sm text-gray-700">{option.substring(3)}</span>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Explanation + Actions */}
            {showResult && (
                <div className="space-y-3 animate-[fade-slide-up_0.3s_ease-out]">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800"><strong>Explanation:</strong> {q.explanation}</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Explain This — only on wrong answers */}
                        {isWrong && onAskTutor && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const correctOption = q.options.find(o => o.startsWith(q.correct))
                                    onAskTutor(
                                        `I got a quiz question wrong and need help understanding it.\n\nQuestion: "${q.question}"\nI answered: "${q.options.find(o => o.startsWith(selected!))?.substring(3)}"\nCorrect answer: "${correctOption?.substring(3)}"\n\nCan you explain why the correct answer is right and why my answer is wrong?`
                                    )
                                }}
                                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                                <MessageSquare className="h-4 w-4" /> Ask AI Tutor
                            </Button>
                        )}
                        <Button onClick={handleNext} className="flex-1 gap-2">
                            {currentIdx + 1 >= questions.length ? 'See Results' : 'Next Question'} <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
