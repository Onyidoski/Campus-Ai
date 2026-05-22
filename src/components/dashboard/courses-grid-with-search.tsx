"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Course = {
  id: string
  code?: string | null
  title?: string | null
  description?: string | null
  level?: string | null
  profiles?: { full_name?: string | null } | null
}

export function CoursesGridWithSearch({
  courses,
  role,
  emptyTitle,
  emptyDescription,
}: {
  courses: Course[]
  role: 'student' | 'lecturer' | 'admin'
  emptyTitle: string
  emptyDescription: string
}) {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const normalizedQuery = query.trim().toLowerCase()

  const filteredCourses = useMemo(() => {
    if (!normalizedQuery) return courses

    return courses.filter((course) => {
      const haystack = [
        course.code || '',
        course.title || '',
        course.description || '',
        course.level || '',
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [courses, normalizedQuery])

  const isAdmin = role === 'admin'
  const isLecturer = role === 'lecturer'
  const isStudent = role === 'student'

  if (courses.length === 0) {
    return (
      <div className="col-span-full flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <BookOpen className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">{emptyTitle}</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <p className="mr-auto hidden text-xs text-slate-500 sm:block">
          Showing {filteredCourses.length} of {courses.length}
        </p>
        {searchOpen || query ? (
          <div className="relative w-full max-w-[250px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses..."
              className="h-9 bg-white pl-8 pr-8"
              aria-label="Search enrolled courses"
            />
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSearchOpen(false)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 active:scale-[0.98]"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-1.5 h-4 w-4" />
            Search
          </Button>
        )}
      </div>

      {filteredCourses.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <h3 className="text-base font-medium text-slate-900">No matching courses found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try another keyword or clear the search field.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 active:scale-[0.98]"
            onClick={() => setQuery('')}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <article
              key={course.id}
              className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_36px_-18px_rgba(15,23,42,0.25)]"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <Badge variant="outline" className="font-mono text-xs">
                  {course.code || 'Course'}
                </Badge>
                {course.level && (
                  <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                    {course.level} Lvl
                  </Badge>
                )}
              </div>

              <div className="flex flex-1 flex-col">
                <h2 className="text-[1.38rem] font-semibold leading-tight tracking-tight text-slate-900">
                  {course.title || 'Untitled Course'}
                </h2>
                <p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-relaxed text-slate-600">
                  {course.description || 'No description provided for this course.'}
                </p>

                {isAdmin && course.profiles?.full_name && (
                  <p className="mt-3 text-xs text-slate-500">
                    Lecturer: <span className="font-medium text-slate-700">{course.profiles.full_name}</span>
                  </p>
                )}

                {isStudent && (
                  <p className="mt-3 text-xs text-slate-500">
                    Materials, discussions, assignments, and class updates are available inside this course.
                  </p>
                )}

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="inline-flex items-center text-sm font-medium text-slate-900 transition-all hover:text-blue-700"
                  >
                    {isAdmin ? 'View Course' : isLecturer ? 'Manage Materials' : 'Enter Course'}
                    <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

