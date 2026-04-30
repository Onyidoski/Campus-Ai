'use client'

import Dexie, { type Table } from 'dexie'

export type OfflineMaterial = {
  id: string
  courseId: string
  title: string
  fileName: string
  fileType: string
  blob: Blob
  downloadedAt: string
}

class CampusOfflineDatabase extends Dexie {
  offlineMaterials!: Table<OfflineMaterial, string>

  constructor() {
    super('campus-ai-offline')
    this.version(1).stores({
      offlineMaterials: 'id, courseId, downloadedAt, fileType',
    })
  }
}

export const offlineDb = new CampusOfflineDatabase()

export async function getOfflineMaterial(materialId: string) {
  return offlineDb.offlineMaterials.get(materialId)
}

export async function getAllOfflineMaterials() {
  return offlineDb.offlineMaterials.orderBy('downloadedAt').reverse().toArray()
}

export async function saveOfflineMaterial(material: OfflineMaterial) {
  await offlineDb.offlineMaterials.put(material)
}

export async function deleteOfflineMaterial(materialId: string) {
  await offlineDb.offlineMaterials.delete(materialId)
}

export function openOfflineBlob(material: OfflineMaterial) {
  const url = URL.createObjectURL(material.blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
