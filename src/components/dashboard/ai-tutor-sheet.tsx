'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { VisuallyHidden } from 'radix-ui'
import { Bot, Send, User, Sparkles, BookOpen, HelpCircle, Lightbulb, GraduationCap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SUGGESTION_CHIPS = [
    { icon: BookOpen, label: 'Summarize the key topics' },
    { icon: HelpCircle, label: 'Explain a difficult concept' },
    { icon: Lightbulb, label: 'Give me study tips' },
    { icon: GraduationCap, label: 'Help me prepare for exams' },
]

export function AITutorSheet({ courseId }: { courseId: string }) {
    const [input, setInput] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { courseId },
        }),
    })

    const isLoading = status === 'submitted' || status === 'streaming'

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return
        sendMessage({ text: input })
        setInput('')
    }

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage({ text: suggestion })
    }

    // Auto-scroll to the bottom when a new message arrives
    const scrollRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isLoading])

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {/* Floating Action Button with gradient and glow */}
                <Button
                    size="lg"
                    className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-lg z-50
                        bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600
                        hover:from-indigo-500 hover:via-violet-500 hover:to-blue-500
                        hover:shadow-indigo-500/30 hover:shadow-2xl hover:scale-105
                        transition-all duration-300 ease-out
                        text-white font-semibold text-sm tracking-wide
                        animate-[fab-glow_3s_ease-in-out_infinite]"
                >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Ask AI Tutor
                </Button>
            </SheetTrigger>

            <SheetContent
                showCloseButton={false}
                className="w-full sm:max-w-lg flex flex-col h-full p-0 gap-0 border-l-0 shadow-2xl"
            >
                {/* Accessibility: visually hidden title for screen readers */}
                <VisuallyHidden.Root>
                    <SheetTitle>Campus AI Tutor</SheetTitle>
                </VisuallyHidden.Root>
                {/* ─── HEADER ─── */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 px-6 py-5">
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full blur-lg" />

                    <div className="relative flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30 shadow-lg">
                            <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Campus AI Tutor</h2>
                            <p className="text-xs text-indigo-100/80 font-medium">
                                Powered by your course materials
                            </p>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 
                            flex items-center justify-center transition-colors duration-200"
                    >
                        <span className="text-white text-lg leading-none">×</span>
                    </button>
                </div>

                {/* ─── MESSAGES ─── */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full px-5 py-4">
                        <div className="space-y-5 pb-4">
                            {messages.length === 0 ? (
                                /* Empty State */
                                <div className="flex flex-col items-center justify-center pt-8 pb-4">
                                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5 shadow-sm">
                                        <Sparkles className="h-8 w-8 text-indigo-500" />
                                    </div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                                        How can I help you today?
                                    </h3>
                                    <p className="text-sm text-gray-500 text-center max-w-[280px] mb-6">
                                        I&apos;ve studied all the materials for this course. Ask me anything!
                                    </p>

                                    {/* Suggestion Chips */}
                                    <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                                        {SUGGESTION_CHIPS.map((chip) => (
                                            <button
                                                key={chip.label}
                                                onClick={() => handleSuggestionClick(chip.label)}
                                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left
                                                bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200
                                                transition-all duration-200 group"
                                            >
                                                <div className="h-8 w-8 rounded-lg bg-white group-hover:bg-indigo-100 
                                                flex items-center justify-center shadow-sm transition-colors duration-200">
                                                    <chip.icon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-700 transition-colors">
                                                    {chip.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((message, idx) => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 animate-[fade-slide-up_0.3s_ease-out_both] ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                            }`}
                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                    >
                                        {/* AI Avatar */}
                                        {message.role === 'assistant' && (
                                            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 
                                            flex items-center justify-center shadow-md shadow-indigo-200/50 mt-1">
                                                <Bot className="h-4 w-4 text-white" />
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`max-w-[80%] ${message.role === 'user'
                                            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md shadow-indigo-200/40'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm'
                                            }`}>
                                            {message.role === 'user' ? (
                                                <p className="text-sm leading-relaxed">
                                                    {message.parts
                                                        .filter((part) => part.type === 'text')
                                                        .map((part, i) => (
                                                            <span key={i}>{part.text}</span>
                                                        ))}
                                                </p>
                                            ) : (
                                                <div className="prose prose-sm prose-gray max-w-none
                                                prose-p:my-1.5 prose-p:leading-relaxed
                                                prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold
                                                prose-ul:my-1.5 prose-ol:my-1.5
                                                prose-li:my-0.5
                                                prose-code:bg-indigo-50 prose-code:text-indigo-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-medium prose-code:before:content-[''] prose-code:after:content-['']
                                                prose-pre:bg-gray-900 prose-pre:rounded-xl prose-pre:shadow-sm
                                                prose-strong:text-gray-900 prose-strong:font-semibold
                                                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {message.parts
                                                            .filter((part) => part.type === 'text')
                                                            .map((part) => part.text)
                                                            .join('')}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>

                                        {/* User Avatar */}
                                        {message.role === 'user' && (
                                            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 
                                            flex items-center justify-center shadow-md mt-1">
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}

                            {/* Loading Indicator — Animated Dots */}
                            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                                <div className="flex gap-3 justify-start animate-[fade-slide-up_0.3s_ease-out_both]">
                                    <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 
                                    flex items-center justify-center shadow-md shadow-indigo-200/50 mt-1">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-indigo-400 animate-[bounce-dot_1.4s_ease-in-out_infinite]" />
                                            <div className="h-2 w-2 rounded-full bg-violet-400 animate-[bounce-dot_1.4s_ease-in-out_0.2s_infinite]" />
                                            <div className="h-2 w-2 rounded-full bg-blue-400 animate-[bounce-dot_1.4s_ease-in-out_0.4s_infinite]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </div>

                {/* ─── INPUT AREA ─── */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-3"
                    >
                        <div className="flex-1 relative">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about your course..."
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-4
                                    text-sm text-gray-900 placeholder:text-gray-400
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                                    transition-all duration-200 shadow-sm"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="h-11 w-11 shrink-0 rounded-xl
                                bg-gradient-to-r from-indigo-600 to-violet-600
                                hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-300/30
                                disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none
                                transition-all duration-200"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}