'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DownloadCloud, FileText, HardDrive, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  deleteOfflineMaterial,
  getAllOfflineMaterials,
  openOfflineBlob,
  type OfflineMaterial,
} from '@/lib/offline-materials'

function formatSize(blob: Blob) {
  const size = blob.size
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function OfflineMaterialsClient() {
  const [materials, setMaterials] = useState<OfflineMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshMaterials = async () => {
    const stored = await getAllOfflineMaterials()
    setMaterials(stored)
    setIsLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    getAllOfflineMaterials().then((stored) => {
      if (!isMounted) return
      setMaterials(stored)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRemove = async (materialId: string) => {
    await deleteOfflineMaterial(materialId)
    await refreshMaterials()
    toast.success('Offline copy removed.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <HardDrive className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Offline Materials</h1>
          </div>
          <p className="text-muted-foreground">
            Files saved on this device remain available without an internet connection.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/courses">
            <DownloadCloud className="mr-2 h-4 w-4" />
            Find Materials
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 rounded-xl border bg-white animate-pulse" />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No offline materials yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Open a course and use the save button on a material to keep a copy on this device.
            </p>
            <Button className="mt-5" asChild>
              <Link href="/dashboard/courses">Go to Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y rounded-xl border bg-white">
          {materials.map((material) => {
            const downloadedAt = new Date(material.downloadedAt)

            return (
              <div key={material.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-sm text-gray-900 truncate">{material.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {material.fileType || 'file'} - {formatSize(material.blob)} - Saved {downloadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  <Button size="sm" onClick={() => openOfflineBlob(material)}>
                    Open
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove offline copy"
                    onClick={() => handleRemove(material.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
