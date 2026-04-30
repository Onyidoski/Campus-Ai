'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HardDrive, RotateCcw, WifiOff } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 px-4 text-center">
      <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6 shadow-sm">
        <WifiOff className="h-10 w-10 text-gray-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re Offline</h1>
      <p className="text-gray-500 max-w-sm mb-6">
        Some live campus features need the internet, but materials saved on this device can still be opened.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button asChild>
          <Link href="/dashboard/offline-materials">
            <HardDrive className="mr-2 h-4 w-4" />
            Offline Materials
          </Link>
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}
