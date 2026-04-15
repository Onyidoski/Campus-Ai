'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, RotateCcw, Loader2, Sparkles } from 'lucide-react'
import type { CourseMaterial } from '@/components/dashboard/study/study-tools-panel'

interface Flashcard {
    front: string
    back: string
}

export function FlashcardMode({ courseId, materials }: { courseId: string; materials: CourseMaterial[] }) {
    const [cards, setCards] = useState<Flashcard[]>([])
    const [currentIdx, setCurrentIdx] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [topic, setTopic] = useState('')
    const [selectedMaterial, setSelectedMaterial] = useState<string>('all')

    const generateFlashcards = async () => {
        setLoading(true)
        setError('')
        setCards([])
        setCurrentIdx(0)
        setFlipped(false)

        try {
            const res = await fetch('/api/study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    mode: 'flashcards',
                    topic: topic || undefined,
                    materialId: selectedMaterial !== 'all' ? selectedMaterial : undefined,
                }),
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)
            if (!data.cards?.length) throw new Error('No flashcards generated.')

            setCards(data.cards)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const nextCard = () => {
        setFlipped(false)
        setTimeout(() => setCurrentIdx(prev => Math.min(prev + 1, cards.length - 1)), 150)
    }

    const prevCard = () => {
        setFlipped(false)
        setTimeout(() => setCurrentIdx(prev => Math.max(prev - 1, 0)), 150)
    }

    // --- EMPTY STATE ---
    if (cards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5 shadow-sm">
                    <Sparkles className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Flashcard Generator</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                    Generate study flashcards from your course materials for quick revision.
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
                    <Input
                        placeholder="Optional: focus on a specific topic..."
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={loading}
                    />
                    <Button onClick={generateFlashcards} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Flashcards'}
                    </Button>
                </div>
                {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
            </div>
        )
    }

    // --- FLASHCARD VIEW ---
    const card = cards[currentIdx]

    return (
        <div className="flex flex-col items-center py-6 space-y-6">
            {/* Counter */}
            <div className="text-sm font-medium text-gray-500">
                Card {currentIdx + 1} of {cards.length}
            </div>

            {/* Flashcard */}
            <div
                className="w-full max-w-md perspective-1000"
                onClick={() => setFlipped(!flipped)}
            >
                <div className={`relative w-full cursor-pointer transition-transform duration-500 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
                    style={{ minHeight: '220px', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.5s ease' }}>
                    {/* Front */}
                    <div
                        className="absolute inset-0 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 flex flex-col items-center justify-center text-center shadow-lg"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <span className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-3">Question</span>
                        <p className="text-lg font-semibold text-gray-900 leading-relaxed">{card.front}</p>
                        <span className="text-xs text-gray-400 mt-4">Click to flip</span>
                    </div>

                    {/* Back */}
                    <div
                        className="absolute inset-0 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 flex flex-col items-center justify-center text-center shadow-lg"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-xs font-medium text-green-500 uppercase tracking-wider mb-3">Answer</span>
                        <p className="text-base text-gray-800 leading-relaxed">{card.back}</p>
                        <span className="text-xs text-gray-400 mt-4">Click to flip back</span>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={prevCard} disabled={currentIdx === 0} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                {/* Dot indicators */}
                <div className="flex gap-1.5">
                    {cards.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-all ${i === currentIdx ? 'bg-amber-500 w-4' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>

                <Button variant="outline" size="icon" onClick={nextCard} disabled={currentIdx === cards.length - 1} className="h-10 w-10 rounded-full">
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Regenerate */}
            <Button variant="ghost" size="sm" onClick={generateFlashcards} className="text-gray-400 hover:text-gray-600 gap-2">
                <RotateCcw className="h-3.5 w-3.5" /> Generate New Cards
            </Button>
        </div>
    )
}
