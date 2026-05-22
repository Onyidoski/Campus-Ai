'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/dashboard/courses/[courseId]/discussions/actions'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { HelpCircle } from 'lucide-react'

export function CreatePostDialog({ courseId }: { courseId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const result = await createPost(formData, courseId)

        setLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(result.success)
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-10 w-full rounded-xl sm:w-auto">
                    <HelpCircle className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">Ask a question</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Start a Discussion</DialogTitle>
                    <DialogDescription>
                        Ask a question or start a topic for your classmates and lecturer to discuss.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="e.g. How do you solve question 3 in chapter 5?"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">Details</Label>
                        <Textarea
                            id="content"
                            name="content"
                            placeholder="Explain your question in more detail..."
                            required
                            rows={5}
                            disabled={loading}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading ? 'Posting...' : 'Post Question'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
