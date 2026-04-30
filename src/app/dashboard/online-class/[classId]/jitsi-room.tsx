'use client'

import { useEffect, useRef, useState } from 'react'
import { updateClassStatus } from '@/app/dashboard/courses/[courseId]/actions'
import { Button } from '@/components/ui/button'
import { Video, VideoOff, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export function JitsiRoom({
  roomName,
  displayName,
  classTitle,
  classId,
  courseId,
  isLecturer,
}: {
  roomName: string
  displayName: string
  classTitle: string
  classId: string
  courseId: string
  isLecturer: boolean
}) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null)
  const jitsiApiRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startMeeting = () => {
    setHasJoined(true)

    // Dynamically load the Jitsi external API script
    const script = document.createElement('script')
    script.src = 'https://meet.jit.si/external_api.js'
    script.async = true

    script.onload = () => {
      if (!jitsiContainerRef.current) return

      try {
        const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: roomName,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: displayName,
          },
          configOverwrite: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            subject: classTitle,
            toolbarButtons: [
              'microphone', 'camera', 'desktop', 'chat',
              'raisehand', 'participants-pane', 'tileview',
              'select-background', 'fullscreen', 'hangup',
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
          },
        })

        jitsiApiRef.current = api
        setIsLoading(false)

        // If this is the lecturer, mark the class as 'live'
        if (isLecturer) {
          updateClassStatus(classId, 'live', courseId)
        }

        // Listen for when the user leaves the call
        api.addEventListener('readyToClose', () => {
          if (isLecturer) {
            updateClassStatus(classId, 'ended', courseId)
          }
          window.location.href = `/dashboard/courses/${courseId}?tab=classes`
        })
      } catch (err) {
        console.error('Jitsi initialization error:', err)
        setError('Failed to initialize video call. Please try again.')
        setIsLoading(false)
      }
    }

    script.onerror = () => {
      setError('Failed to load video conferencing. Check your internet connection.')
      setIsLoading(false)
    }

    document.body.appendChild(script)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose()
      }
    }
  }, [])

  // Pre-join screen
  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-white px-4">
        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mb-6">
          <Video className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Ready to join?</h2>
        <p className="text-gray-400 text-sm max-w-sm mb-2">
          You&apos;re about to join the video class as <span className="text-white font-medium">{displayName}</span>.
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Your camera and mic will be off by default. You can turn them on once you join.
        </p>
        <Button
          size="lg"
          onClick={startMeeting}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 
            text-white px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 
            transition-all duration-300 hover:scale-105"
        >
          <Video className="mr-2 h-5 w-5" />
          Join Class
        </Button>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-white px-4">
        <div className="h-16 w-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <VideoOff className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Connection Error</h2>
        <p className="text-gray-400 text-sm max-w-sm">{error}</p>
        <Button variant="secondary" className="mt-6" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-900">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
          <p className="text-gray-400 text-sm">Connecting to video class...</p>
        </div>
      )}

      {/* Jitsi container */}
      <div
        ref={jitsiContainerRef}
        className="h-full w-full"
      />
    </div>
  )
}
