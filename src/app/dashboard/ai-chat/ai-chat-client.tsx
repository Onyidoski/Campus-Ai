'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, FormEvent } from 'react'
import Link from 'next/link'
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
    { icon: BookOpen, label: 'What assignments are due this week?' },
    { icon: HelpCircle, label: 'Do I have any class today?' },
    { icon: Lightbulb, label: 'Show me urgent announcements' },
    { icon: GraduationCap, label: 'Summarize the key topics in this course' },
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
            <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-center px-4 bg-slate-50">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-6 shadow-sm">
                    <BookMarked className="h-10 w-10 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">No Courses Yet</h2>
                <p className="text-sm text-slate-500 max-w-sm">
                    You need to be enrolled in at least one course to use the AI Companion.
                    Head to <Link href="/dashboard/courses" className="text-indigo-600 font-medium hover:underline">My Courses</Link> to join a class.
                </p>
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-[calc(100vh-64px)]">
            {/* BEGIN: Header */}
            <header className="bg-white border-b border-slate-200 flex-shrink-0 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm relative">
                        <Sparkles className="text-white w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute -bottom-1 -right-1 bg-white text-violet-700 text-[8px] md:text-[9px] font-bold px-1 rounded-full border border-slate-100 shadow-sm">AI</span>
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold text-slate-900 leading-tight">Campus AI Companion</h1>
                        <p className="text-xs md:text-sm text-slate-500 hidden sm:block">Ask anything about your courses</p>
                    </div>
                </div>
                <button 
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-3 md:px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">New Chat</span>
                </button>
            </header>
            {/* END: Header */}

            {/* BEGIN: Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6 relative flex flex-col pb-44 md:pb-40">
                {/* Course Selector */}
                <div className="max-w-4xl w-full mx-auto mb-6 md:mb-8 relative" ref={dropdownRef}>
                    <div 
                        onClick={() => setShowCourseSelector(!showCourseSelector)}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer hover:border-slate-300 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                {selectedCourse ? selectedCourse.code.slice(0, 2) : 'CS'}
                            </div>
                            <span className="font-semibold text-slate-800 text-sm truncate">
                                {selectedCourse ? `${selectedCourse.code} – ${selectedCourse.title}` : 'Select a course'}
                            </span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showCourseSelector ? 'rotate-180' : ''}`} />
                    </div>
                    {/* Dropdown */}
                    {showCourseSelector && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
                            <div className="py-1.5 max-h-60 overflow-y-auto">
                                {courses.map((course) => (
                                    <button
                                        key={course.id}
                                        onClick={() => handleCourseChange(course.id)}
                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-150
                                            ${course.id === selectedCourseId
                                                ? 'bg-slate-50 text-indigo-700'
                                                : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 uppercase
                                            ${course.id === selectedCourseId
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {course.code.slice(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{course.code} – {course.title}</p>
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

                {/* Chat Messages Container */}
                <div className="max-w-4xl w-full mx-auto flex flex-col gap-5 md:gap-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center pt-4 pb-8 px-2">
                            <div className="relative mb-5 md:mb-6">
                                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-blue-100 flex items-center justify-center shadow-sm">
                                    <Sparkles className="h-8 w-8 md:h-9 md:w-9 text-indigo-500" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 md:h-6 md:w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md">
                                    <Bot className="h-3 w-3 md:h-3.5 md:w-3.5 text-white" />
                                </div>
                            </div>
                            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-1 text-center">
                                Hi {userName.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-sm text-slate-500 text-center max-w-xs mb-6 md:mb-8 leading-relaxed">
                                I've studied all the materials for <span className="font-semibold text-indigo-600">{selectedCourse?.code}</span>. Ask me anything!
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3 w-full max-w-lg">
                                {SUGGESTION_CHIPS.map((chip) => (
                                    <button
                                        key={chip.label}
                                        onClick={() => handleSuggestionClick(chip.label)}
                                        className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-left bg-white border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm"
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                            <chip.icon className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <span className="text-xs md:text-sm font-medium text-slate-600 leading-snug">
                                            {chip.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message, idx) => (
                            message.role === 'user' ? (
                                /* Message: User */
                                <div key={message.id} className="flex justify-end gap-2.5 md:gap-4 mt-1 md:mt-2">
                                    <div className="bg-violet-600 text-white p-3.5 md:p-4 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-2xl shadow-sm relative group">
                                        <p className="text-sm leading-relaxed break-words">
                                            {message.parts
                                                .filter((part) => part.type === 'text')
                                                .map((part, i) => (
                                                    <span key={i}>{part.text}</span>
                                                ))}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-lg flex-shrink-0 flex items-center justify-center mt-1">
                                        <User className="text-white w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                </div>
                            ) : (
                                /* Message: AI */
                                <div key={message.id} className="flex gap-2.5 md:gap-4 mt-1 md:mt-2">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-600 rounded-lg flex-shrink-0 flex items-center justify-center mt-1">
                                        <Bot className="text-white w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl rounded-tl-sm max-w-[88%] md:max-w-3xl shadow-sm relative group overflow-hidden">
                                        <div className="prose prose-sm prose-slate max-w-none
                                            prose-p:my-1.5 prose-p:leading-relaxed prose-p:text-slate-700
                                            prose-headings:mt-3 prose-headings:mb-1.5 prose-headings:font-semibold prose-headings:text-slate-800
                                            prose-ul:my-2 prose-ol:my-2 prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-5 prose-ol:pl-5
                                            prose-li:my-1 prose-li:text-slate-700
                                            prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] md:prose-code:text-xs prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                                            prose-pre:bg-[#242b3d] prose-pre:text-slate-300 prose-pre:rounded-xl prose-pre:p-4 md:prose-pre:p-6 prose-pre:font-mono prose-pre:text-xs md:prose-pre:text-sm prose-pre:leading-tight prose-pre:overflow-x-auto
                                            prose-strong:text-slate-800 prose-strong:font-semibold
                                            prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline break-words">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {message.parts
                                                    .filter((part) => part.type === 'text')
                                                    .map((part) => part.text)
                                                    .join('')}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))
                    )}
                    
                    {/* Loading Indicator */}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                        <div className="flex gap-2.5 md:gap-4 mt-1 md:mt-2">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-600 rounded-lg flex-shrink-0 flex items-center justify-center mt-1">
                                <Bot className="text-white w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div className="bg-white border border-slate-200 px-3 md:px-4 py-2.5 md:py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 w-max">
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </div>
            {/* END: Chat Area */}

            {/* BEGIN: Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8 md:pt-10 pb-4 md:pb-6 px-4 md:px-8 z-20">
                <div className="max-w-4xl w-full mx-auto">
                    <form onSubmit={handleSubmit} className="relative flex items-center">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-xl focus:ring-violet-500 focus:border-violet-500 block p-3 md:p-4 pr-12 md:pr-16 shadow-sm placeholder-slate-400"
                            placeholder={selectedCourse ? `Ask about ${selectedCourse.code}...` : 'Select a course first...'}
                            type="text"
                            disabled={isLoading || !selectedCourseId}
                        />
                        <button 
                            type="submit"
                            disabled={isLoading || !input.trim() || !selectedCourseId}
                            className="absolute right-1.5 md:right-2 text-white bg-violet-600 hover:bg-violet-700 focus:ring-4 focus:outline-none focus:ring-violet-300 font-medium rounded-lg text-sm px-3 md:px-4 py-2 md:py-2.5 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </form>
                    <p className="text-center text-[10px] md:text-[11px] text-slate-400 mt-2 md:mt-3 leading-tight px-2">
                        Campus AI uses your course materials to answer questions. Responses may not always be accurate.
                    </p>
                </div>
            </div>
            {/* END: Input Area */}
        </div>
    )
}
