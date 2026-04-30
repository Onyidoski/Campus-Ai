import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MaterialReaderClient } from '@/components/dashboard/material-reader-client'

type Material = {
  id: string
  course_id: string
  title: string
  file_url: string
  file_type?: string | null
}

export default async function MaterialReaderPage({
  params,
}: {
  params: Promise<{ courseId: string; materialId: string }>
}) {
  const supabase = await createClient()
  const { courseId, materialId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses')
    .select('id, code, title, lecturer_id')
    .eq('id', courseId)
    .single()

  if (!course) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/dashboard/admin/courses')

  const isLecturer = course.lecturer_id === user.id
  if (!isLecturer) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .maybeSingle()

    if (!enrollment) redirect('/dashboard/courses')
  }

  const { data: material } = await supabase
    .from('materials')
    .select('id, course_id, title, file_url, file_type')
    .eq('id', materialId)
    .eq('course_id', courseId)
    .single()

  if (!material) notFound()

  const typedMaterial = material as Material

  return (
    <div className="space-y-5">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2 text-muted-foreground" asChild>
          <Link href={`/dashboard/courses/${courseId}?tab=materials`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Materials
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="font-mono">{course.code}</Badge>
              <Badge variant="outline">{typedMaterial.file_type || 'material'}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight truncate">{typedMaterial.title}</h1>
            <p className="text-muted-foreground mt-1">{course.title}</p>
          </div>
        </div>
      </div>

      <MaterialReaderClient courseId={courseId} material={typedMaterial} />
    </div>
  )
}
