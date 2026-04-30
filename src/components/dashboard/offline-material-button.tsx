'use client'

import { useEffect, useState } from 'react'
import { HardDriveDownload, HardDrive, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  deleteOfflineMaterial,
  getOfflineMaterial,
  openOfflineBlob,
  saveOfflineMaterial,
  type OfflineMaterial,
} from '@/lib/offline-materials'

type OfflineMaterialButtonProps = {
  material: {
    id: string
    course_id: string
    title: string
    file_name?: string | null
    file_type?: string | null
  }
}

export function OfflineMaterialButton({ material }: OfflineMaterialButtonProps) {
  const [offlineMaterial, setOfflineMaterial] = useState<OfflineMaterial | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let isMounted = true

    getOfflineMaterial(material.id).then((stored) => {
      if (isMounted) setOfflineMaterial(stored || null)
    })

    return () => {
      isMounted = false
    }
  }, [material.id])

  const handleDownload = async () => {
    setIsBusy(true)

    try {
      const response = await fetch(`/api/materials/${material.id}/download`)
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.error || 'Download failed')
      }

      const blob = await response.blob()
      const savedMaterial: OfflineMaterial = {
        id: material.id,
        courseId: material.course_id,
        title: material.title,
        fileName: material.file_name || `${material.title}.${material.file_type || 'file'}`,
        fileType: material.file_type || blob.type || 'file',
        blob,
        downloadedAt: new Date().toISOString(),
      }

      await saveOfflineMaterial(savedMaterial)
      setOfflineMaterial(savedMaterial)
      toast.success('Material saved for offline use.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this material offline.'
      toast.error(message)
    } finally {
      setIsBusy(false)
    }
  }

  const handleRemove = async () => {
    setIsBusy(true)

    try {
      await deleteOfflineMaterial(material.id)
      setOfflineMaterial(null)
      toast.success('Offline copy removed.')
    } catch {
      toast.error('Could not remove the offline copy.')
    } finally {
      setIsBusy(false)
    }
  }

  if (offlineMaterial) {
    return (
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
          title="Open offline copy"
          onClick={() => openOfflineBlob(offlineMaterial)}
          disabled={isBusy}
        >
          <HardDrive className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
          title="Remove offline copy"
          onClick={handleRemove}
          disabled={isBusy}
        >
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2.5 text-xs text-gray-500 hover:bg-emerald-50 hover:text-emerald-700"
      title="Save for offline use"
      onClick={handleDownload}
      disabled={isBusy}
    >
      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HardDriveDownload className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">Offline</span>
    </Button>
  )
}
