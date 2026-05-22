"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, FileText, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OfflineMaterialButton } from '@/components/dashboard/offline-material-button'
import { deleteMaterial } from '@/app/dashboard/courses/[courseId]/actions'

type Material = {
  id: string
  course_id: string
  title: string
  file_name?: string | null
  file_type?: string | null
  file_url: string
  created_at?: string | null
}

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
  'video/mp4': 'MP4',
  'audio/mpeg': 'MP3',
  'application/zip': 'ZIP',
}

function formatFileTypeLabel(fileType?: string | null, fileName?: string | null) {
  if (fileType) {
    const direct = MIME_LABELS[fileType.toLowerCase()]
    if (direct) return direct

    if (!fileType.includes('/') && fileType.length <= 6) {
      return fileType.toUpperCase()
    }
  }

  if (fileName && fileName.includes('.')) {
    const ext = fileName.split('.').pop()
    if (ext && ext.length <= 6) return ext.toUpperCase()
  }

  return 'FILE'
}

function formatRelativeDate(dateValue?: string | null) {
  if (!dateValue) return 'Added recently'
  const date = new Date(dateValue)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Added just now'
  if (diffHours < 24) return `Added ${diffHours}h ago`
  if (diffDays < 7) return `Added ${diffDays}d ago`
  return `Added ${date.toLocaleDateString()}`
}

export function MaterialsTabContent({
  materials,
  courseId,
  isLecturer,
}: {
  materials: Material[]
  courseId: string
  isLecturer: boolean
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const filteredMaterials = useMemo(() => {
    if (!normalizedQuery) return materials
    return materials.filter((file) => {
      const haystack = `${file.title || ''} ${file.file_name || ''} ${file.file_type || ''}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [materials, normalizedQuery])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Course Materials</h3>
          <p className="mt-1 text-sm text-slate-500">
            {filteredMaterials.length} of {materials.length} file{materials.length === 1 ? '' : 's'} available.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {searchOpen || query ? (
            <div className="relative w-[260px] max-w-[75vw]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search materials..."
                className="h-10 bg-white pl-9 pr-9"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                onClick={() => {
                  setQuery('')
                  setSearchOpen(false)
                }}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4 active:scale-[0.98]"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          )}
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14">
          <div className="text-center text-muted-foreground">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-900">No materials uploaded yet</p>
            {isLecturer && (
              <p className="mt-1 text-sm text-slate-500">
                Use the upload button at the top to add your first file.
              </p>
            )}
          </div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <p className="text-base font-medium text-slate-900">No matching materials</p>
          <p className="mt-1 text-sm text-slate-500">Try a different keyword or clear search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMaterials.map((file) => {
            const typeLabel = formatFileTypeLabel(file.file_type, file.file_name)
            return (
              <article
                key={file.id}
                className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.25)] sm:p-5"
              >
                <div className="mb-3 flex min-w-0 items-start justify-between gap-3 sm:mb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 transition-colors group-hover:bg-blue-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Material</p>
                      <p className="truncate text-xs font-semibold text-slate-700">{typeLabel}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <OfflineMaterialButton material={file} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                      asChild
                      title="Download file"
                    >
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>

                    {isLecturer && (
                      <form action={deleteMaterial.bind(null, file.id, courseId)}>
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete material"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <h4 className="line-clamp-2 break-words text-base font-semibold leading-tight text-slate-900" title={file.title}>
                    {file.title}
                  </h4>
                  {file.file_name && (
                    <p className="mt-2 hidden truncate text-xs text-slate-500 sm:block" title={file.file_name}>
                      {file.file_name}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-500 sm:mt-3">{formatRelativeDate(file.created_at)}</p>

                  <div className="mt-3 border-t border-slate-100 pt-3 sm:mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-full justify-between text-sm font-medium active:scale-[0.98]"
                      asChild
                    >
                      <Link href={`/dashboard/courses/${courseId}/materials/${file.id}`}>
                        Open Material
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

