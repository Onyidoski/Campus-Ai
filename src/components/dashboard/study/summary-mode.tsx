'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { RotateCcw, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { CourseMaterial } from '@/components/dashboard/study/study-tools-panel'

export function SummaryMode({ courseId, materials }: { courseId: string; materials: CourseMaterial[] }) {
    const [summary, setSummary] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [topic, setTopic] = useState('')
    const [selectedMaterial, setSelectedMaterial] = useState<string>('all')

    const generateSummary = async () => {
        setLoading(true)
        setError('')
        setSummary('')

        try {
            const res = await fetch('/api/study', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    mode: 'summary',
                    topic: topic || undefined,
                    materialId: selectedMaterial !== 'all' ? selectedMaterial : undefined,
                }),
            })
            const data = await res.json()

            if (!res.ok) throw new Error(data.error)
            if (!data.content) throw new Error('No summary generated.')

            setSummary(data.content)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // --- EMPTY STATE ---
    if (!summary && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-5 shadow-sm">
                    <Sparkles className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Summary Generator</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                    Generate a comprehensive study summary from your course materials.
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
                    <Button onClick={generateSummary} disabled={loading} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Summary'}
                    </Button>
                </div>
                {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
            </div>
        )
    }

    // --- LOADING STATE ---
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Analyzing course materials and generating summary...</p>
            </div>
        )
    }

    // --- SUMMARY VIEW ---
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Study Summary</h3>
                <Button variant="ghost" size="sm" onClick={generateSummary} className="text-gray-400 hover:text-gray-600 gap-2">
                    <RotateCcw className="h-3.5 w-3.5" /> Regenerate
                </Button>
            </div>

            <div className="bg-white border rounded-xl p-6 shadow-sm prose prose-sm prose-gray max-w-none
                prose-headings:text-gray-900 prose-headings:font-semibold
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-ul:text-gray-700 prose-ol:text-gray-700
                prose-strong:text-gray-900
                prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-hr:border-gray-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summary}
                </ReactMarkdown>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    )
}
