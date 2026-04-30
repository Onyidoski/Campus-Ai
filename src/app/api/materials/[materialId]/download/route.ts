import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { materialId } = await params

  const { data: material, error } = await supabase
    .from('materials')
    .select('title, file_url, file_type')
    .eq('id', materialId)
    .single()

  if (error) {
    console.error('Material lookup error:', error)
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  if (!material?.file_url) {
    return NextResponse.json({ error: 'Material file URL is missing.' }, { status: 404 })
  }

  let fileUrl: URL
  try {
    fileUrl = new URL(material.file_url)
    if (!['http:', 'https:'].includes(fileUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid material URL.' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid material URL.' }, { status: 400 })
  }

  const response = await fetch(fileUrl)
  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: `Could not download material from storage (${response.status}).` },
      { status: 502 }
    )
  }

  const contentType = response.headers.get('content-type') || material.file_type || 'application/octet-stream'
  const extension = material.file_type || 'file'
  const fileName = `${material.title || 'material'}${material.title?.endsWith(`.${extension}`) ? '' : `.${extension}`}`

  return new Response(response.body, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName.replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
