'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Bot, Send, User, Sparkles, BookOpen, HelpCircle, Lightbulb,
    GraduationCap, ChevronDown, RotateCcw, BookMarked
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Course = {
    id: string
    code: string
    title: string
}

const SUGGESTION_CHIPS = [
    { icon: BookOpen, label: 'Summarize the key topics in this course' },
    { icon: HelpCircle, label: 'Explain a concept I\'m struggling with' },
    { icon: Lightbulb, label: 'Give me tips to study for this course' },
    { icon: GraduationCap, label: 'Help me prepare for my exams' },
]

export function AIChatClient({ courses, userName }: { courses: Course[], userName: string }) {
    const [input, setInput] = useState('')
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '')
    const [showCourseSelector, setShowCourseSelector] = useState(false)

    const selectedCourse = courses.find(c => c.id === selectedCourseId)

    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { courseId: selectedCourseId },
        }),
    })

    const isLoading = status === 'submitted' || status === 'streaming'

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading || !selectedCourseId) return
        sendMessage({ text: input })
        setInput('')
    }

    const handleSuggestionClick = (suggestion: string) => {
        if (!selectedCourseId) return
        sendMessage({ text: suggestion })
    }

    const handleNewChat = () => {
        setMessages([])
    }

    const handleCourseChange = (courseId: string) => {
        setSelectedCourseId(courseId)
        setMessages([]) // Clear chat when switching courses
        setShowCourseSelector(false)
    }

    // Auto-scroll
    const scrollRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isLoading])

    // Close dropdown on outside click
    const dropdownRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowCourseSelector(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // No courses enrolled fallback
    if (courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-center px-4">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-6 shadow-sm">
                    <BookMarked className="h-10 w-10 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Courses Yet</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                    You need to be enrolled in at least one course to use the AI Companion.
                    Head to <a href="/dashboard/courses" className="text-indigo-600 font-medium hover:underline">My Courses</a> to join a class.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] max-w-4xl mx-auto">

            {/* ─── TOP BAR ─── */}
            <div className="flex items-center justify-between px-2 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    {/* AI Icon */}
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-indigo-200/50">
                        <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900 leading-tight">Campus AI Companion</h1>
                        <p className="text-[11px] text-gray-400 font-medium">Ask anything about your courses</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* New Chat Button */}
                    {messages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleNewChat}
                            className="text-xs text-gray-500 hover:text-indigo-600 gap-1.5"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">New Chat</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* ─── COURSE SELECTOR ─── */}
            <div className="px-2 py-2.5 border-b border-gray-100 bg-gray-50/50">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowCourseSelector(!showCourseSelector)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl
                            bg-white border border-gray-200 hover:border-indigo-300
                            transition-all duration-200 shadow-sm group"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">Chatting about</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {selectedCourse ? `${selectedCourse.code} — ${selectedCourse.title}` : 'Select a course'}
                                </p>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${showCourseSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {showCourseSelector && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden animate-[fade-slide-up_0.2s_ease-out_both]">
                            <div className="py-1.5 max-h-60 overflow-y-auto">
                                {courses.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => handleCourseChange(course.id)}
                                        className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors duration-150
                                            ${course.id === selectedCourseId
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                    >
                                        <div className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0
                                            ${course.id === selectedCourseId
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {course.code.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{course.title}</p>
                                            <p className="text-[11px] text-gray-400">{course.code}</p>
                                        </div>
                                        {course.id === selectedCourseId && (
                                            <div className="ml-auto shrink-0">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── MESSAGES AREA ─── */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-2 sm:px-4 py-4">
                    <div className="space-y-5 pb-4">
                        {messages.length === 0 ? (
                            /* ── Empty State ── */
                            <div className="flex flex-col items-center justify-center pt-8 sm:pt-16 pb-4">
                                {/* Gradient orb */}
                                <div className="relative mb-6">
                                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-blue-100 flex items-center justify-center shadow-sm">
                                        <Sparkles className="h-9 w-9 text-indigo-500" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                                        <Bot className="h-3.5 w-3.5 text-white" />
                                    </div>
                                </div>

                                <h2 className="text-lg font-bold text-gray-900 mb-1">
                                    Hi {userName.split(' ')[0]}! 👋
                                </h2>
                                <p className="text-sm text-gray-500 text-center max-w-xs mb-8">
                                    I&apos;ve studied all the materials for <span className="font-medium text-indigo-600">{selectedCourse?.code}</span>.
                                    Ask me anything about the course!
                                </p>

                                {/* Suggestion Chips */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                                    {SUGGESTION_CHIPS.map((chip) => (
                                        <button
                                            key={chip.label}
                                            onClick={() => handleSuggestionClick(chip.label)}
                                            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left
                                                bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200
                                                transition-all duration-200 group shadow-sm hover:shadow-md"
                                        >
                                            <div className="h-9 w-9 rounded-lg bg-gray-50 group-hover:bg-indigo-100 
                                                flex items-center justify-center shadow-sm transition-colors duration-200 shrink-0">
                                                <chip.icon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 group-hover:text-indigo-700 transition-colors leading-snug">
                                                {chip.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* ── Chat Messages ── */
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
                                    <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user'
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

                        {/* Loading Indicator */}
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
            <div className="px-2 sm:px-4 py-3 border-t border-gray-100 bg-white">
                <form
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2.5 max-w-3xl mx-auto"
                >
                    <div className="flex-1 relative">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={selectedCourse ? `Ask about ${selectedCourse.code}...` : 'Select a course first...'}
                            className="w-full rounded-xl border border-gray-200 bg-white pl-4 pr-4 py-3
                                text-sm text-gray-900 placeholder:text-gray-400
                                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400
                                transition-all duration-200 shadow-sm"
                            disabled={isLoading || !selectedCourseId}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim() || !selectedCourseId}
                        className="h-[46px] w-[46px] shrink-0 rounded-xl
                            bg-gradient-to-r from-indigo-600 to-violet-600
                            hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-300/30
                            disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none
                            transition-all duration-200"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
                <p className="text-center text-[10px] text-gray-400 mt-2">
                    Campus AI uses your course materials to answer questions. Responses may not always be accurate.
                </p>
            </div>
        </div>
    )
}
