'use client'

import { useState } from 'react'
import { unlinkStudent } from '@/app/dashboard/parent/actions'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { UserMinus } from 'lucide-react'

export function UnlinkStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleUnlink() {
    setIsLoading(true)
    const result = await unlinkStudent(studentId)
    setIsLoading(false)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Unlinked from ${studentName}`)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Unlink student"
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unlink {studentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer be able to view {studentName}&apos;s academic information. You can re-link them later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnlink}
            className="bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Unlinking...' : 'Unlink'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
