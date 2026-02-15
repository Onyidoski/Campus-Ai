'use client'

import { useState, useRef } from 'react'
import { uploadMaterial } from '@/app/dashboard/courses/[courseId]/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress' // <-- IMPORT THIS
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

export function UploadMaterialDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0) // Track progress
  const intervalRef = useRef<NodeJS.Timeout | null>(null) // Hold the timer

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File
    
    // Safety check
    if (!file || file.size === 0) {
      toast.error("Please select a valid file.")
      return
    }

    setLoading(true)
    setProgress(0)

    // --- START FAKE PROGRESS ANIMATION ---
    // We increment the progress bar every 300ms.
    // It will stall at 95% until the server actually finishes.
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(intervalRef.current!)
          return 95
        }
        return prev + 5
      })
    }, 300) 

    try {
      // Execute the Server Action
      const result = await uploadMaterial(formData, courseId)

      // --- UPLOAD FINISHED ---
      clearInterval(intervalRef.current!)
      setProgress(100) // Snap to 100%

      // Give it a tiny delay so the user sees "100%" before the modal closes
      setTimeout(() => {
        setLoading(false)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success('Material uploaded successfully!')
          setOpen(false) 
          setProgress(0) // Reset for next time
        }
      }, 500)

    } catch (error) {
      clearInterval(intervalRef.current!)
      setLoading(false)
      setProgress(0)
      toast.error("An unexpected error occurred.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Don't allow closing if currently uploading
      if (loading) return 
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" /> Upload Material
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Course Material</DialogTitle>
          <DialogDescription>
            Upload PDFs, Slides, or Images to Cloudflare R2 for your students.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="e.g., Week 1 Slides" required disabled={loading} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <Input 
              id="file" 
              name="file" 
              type="file" 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
              required 
              disabled={loading}
            />
          </div>

          {/* PROGRESS BAR (Only shows when uploading) */}
          {loading && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 w-full" />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Processing...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}