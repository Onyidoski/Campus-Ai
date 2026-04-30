'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, BookOpen, Download, ExternalLink, FileText, HelpCircle, Lightbulb, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

type MaterialReaderClientProps = {
  courseId: string
  material: {
    id: string
    title: string
    file_url: string
    file_type?: string | null
  }
}

const SUGGESTIONS = [
  { icon: BookOpen, label: 'Summarize this material' },
  { icon: HelpCircle, label: 'Explain the hardest concept in this material' },
  { icon: Lightbulb, label: 'Generate 5 likely exam questions from this material' },
  { icon: FileText, label: 'Create flashcards from this material' },
]

export function MaterialReaderClient({ courseId, material }: MaterialReaderClientProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileType = material.file_type?.toLowerCase() || ''
  const isPdf = fileType.includes('pdf') || material.file_url.toLowerCase().includes('.pdf')
  const readerUrl = isPdf ? `${material.file_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH` : material.file_url

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { courseId, materialId: material.id },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestion = (suggestion: string) => {
    if (isLoading) return
    sendMessage({ text: suggestion })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="min-h-[78dvh] overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">PDF Reader</p>
            <h2 className="font-semibold text-gray-900 truncate">{material.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <a href={material.file_url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={material.file_url} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </div>

        {isPdf ? (
          <div className="bg-zinc-100 p-3 sm:p-5">
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <iframe
                title={material.title}
                src={readerUrl}
                className="h-[76dvh] w-full bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-[76dvh] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 h-14 w-14 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Preview unavailable</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              This file type may not preview in the browser. You can still download it and ask Campus AI questions about the processed content.
            </p>
            <Button className="mt-5" asChild>
              <a href={material.file_url} target="_blank" rel="noopener noreferrer" download>
                Download Material
              </a>
            </Button>
          </div>
        )}
      </section>

      <aside className="min-h-[72dvh] overflow-hidden rounded-xl border bg-white flex flex-col">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Study Sidebar</h2>
              <p className="text-xs text-muted-foreground">Focused on this material</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <h3 className="text-sm font-semibold text-indigo-950">Start with a study prompt</h3>
                  <p className="mt-1 text-sm text-indigo-900/70">
                    Tap a question below or ask your own. Campus AI will use this material first.
                  </p>
                </div>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onClick={() => handleSuggestion(suggestion.label)}
                    className="flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-3 text-left transition-colors hover:bg-gray-50"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                      <suggestion.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{suggestion.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="mt-1 h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    message.role === 'user'
                      ? 'rounded-br-md bg-indigo-600 text-white'
                      : 'rounded-tl-md border bg-white text-gray-800'
                  }`}>
                    {message.role === 'user' ? (
                      <p>
                        {message.parts
                          .filter((part) => part.type === 'text')
                          .map((part) => part.text)
                          .join('')}
                      </p>
                    ) : (
                      <div className="prose prose-sm prose-gray max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.parts
                            .filter((part) => part.type === 'text')
                            .map((part) => part.text)
                            .join('')}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="mt-1 h-8 w-8 rounded-lg bg-gray-900 text-white flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="mt-1 h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md border bg-white px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:120ms]" />
                    <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="border-t p-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about this material..."
            className="min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-10 w-10 rounded-xl">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </aside>
    </div>
  )
}
