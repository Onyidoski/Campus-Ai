'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Bot, Send, User, Sparkles, Loader2 } from 'lucide-react'

export function AITutorSheet({ courseId }: { courseId: string }) {
    // Manage input state locally (required in AI SDK v5+)
    const [input, setInput] = useState('')

    // The useChat hook handles streaming and API calls
    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { courseId }, // Pass the courseId so the backend searches the right PDFs
        }),
    })

    // Derive loading state from the new status API
    const isLoading = status === 'submitted' || status === 'streaming'

    // Custom submit handler
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return
        sendMessage({ text: input })
        setInput('')
    }

    // Auto-scroll to the bottom when a new message arrives
    const scrollRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    return (
        <Sheet>
            <SheetTrigger asChild>
                {/* The Floating Action Button */}
                <Button
                    size="lg"
                    className="fixed bottom-6 right-6 h-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-200 z-50"
                >
                    <Sparkles className="h-6 w-6 mr-2" />
                    Ask AI Tutor
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-md flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Bot className="h-5 w-5 text-blue-700" />
                        </div>
                        Campus AI Tutor
                    </SheetTitle>
                    <SheetDescription>
                        Ask questions about your course materials, assignments, and lectures.
                    </SheetDescription>
                </SheetHeader>

                {/* Chat Messages Area */}
                <ScrollArea className="flex-1 pr-4 mt-4">
                    <div className="space-y-4 pb-4">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center h-40 text-muted-foreground">
                                <Bot className="h-10 w-10 mb-3 text-blue-200" />
                                <p className="text-sm">Hi! I have read all the materials for this course.<br />What would you like to know?</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                            <Bot className="h-4 w-4 text-blue-700" />
                                        </div>
                                    )}

                                    <div className={`text-sm px-4 py-3 rounded-2xl max-w-[85%] ${message.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 text-gray-800 rounded-tl-none whitespace-pre-wrap'
                                        }`}>
                                        {message.parts
                                            .filter((part) => part.type === 'text')
                                            .map((part, i) => (
                                                <span key={i}>{part.text}</span>
                                            ))}
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="h-4 w-4 text-gray-600" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="h-8 w-8 shrink-0 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                    <Bot className="h-4 w-4 text-blue-700" />
                                </div>
                                <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-sm text-gray-500">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="pt-4 border-t mt-auto">
                    <form
                        onSubmit={handleSubmit}
                        className="flex items-center gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about the lecture notes..."
                            className="flex-1 rounded-full bg-gray-50 border-gray-200 focus-visible:ring-blue-600"
                            disabled={isLoading}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="rounded-full h-10 w-10 shrink-0 bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}