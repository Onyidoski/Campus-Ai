'use client'

import { useState, useRef } from 'react'
import { submitAssignment } from '@/app/dashboard/courses/[courseId]/actions'
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
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, RefreshCw } from 'lucide-react'

export function SubmitAssignmentDialog({ 
  courseId, 
  assignmentId, 
  isResubmit = false 
}: { 
  courseId: string, 
  assignmentId: string,
  isResubmit?: boolean 
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setProgress(0)

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(intervalRef.current!)
          return 95
        }
        return prev + 5
      })
    }, 300)

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await submitAssignment(formData, assignmentId, courseId)

      clearInterval(intervalRef.current!)
      setProgress(100)

      setTimeout(() => {
        setLoading(false)
        if (result?.error) {
          toast.error(result.error)
        } else {
          toast.success(isResubmit ? 'Assignment resubmitted!' : 'Assignment submitted successfully!')
          setOpen(false)
          setProgress(0)
        }
      }, 500)
    } catch (error) {
      clearInterval(intervalRef.current!)
      setLoading(false)
      setProgress(0)
      console.error(error)
      toast.error("An unexpected error occurred.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (loading) return 
      setOpen(isOpen)
    }}>
      <DialogTrigger asChild>
        {isResubmit ? (
          <Button variant="outline" size="icon" className="h-8 w-8" title="Resubmit">
             <RefreshCw className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="w-full text-sm h-8">
            <Upload className="mr-2 h-4 w-4" /> Submit Work
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isResubmit ? 'Resubmit Assignment' : 'Submit Assignment'}</DialogTitle>
          <DialogDescription>
            {isResubmit 
              ? 'Upload a new file. This will replace your previous submission.' 
              : 'Upload your completed work as a PDF, Document, or Image.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="file">Your File</Label>
            <Input 
              id="file" 
              name="file" 
              type="file" 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" 
              required
              disabled={loading} 
            />
          </div>

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
              {loading ? 'Processing...' : (isResubmit ? 'Resubmit' : 'Submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}