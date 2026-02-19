import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GradeSubmissionDialog } from '@/components/dashboard/grade-submission-dialog'
import { ArrowLeft, Download, FileText, CheckCircle2, Clock } from 'lucide-react'

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }> | { courseId: string; assignmentId: string }
}) {
  const supabase = await createClient()
  
  const resolvedParams = await params
  const { courseId, assignmentId } = resolvedParams

  // 1. Authenticate & check role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase.from('courses').select('lecturer_id').eq('id', courseId).single()
  if (course?.lecturer_id !== user.id) redirect(`/dashboard/courses/${courseId}`) // Kick out students!

  // 2. Fetch Assignment Data
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (error || !assignment) notFound()

  // 3. Fetch all submissions WITH the student's profile information
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, profiles:student_id(full_name, email)')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })

  const dueDate = new Date(assignment.due_date)

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" asChild>
          <Link href={`/dashboard/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Submissions: {assignment.title}</h1>
        <p className="text-muted-foreground mt-1">Review and grade student work.</p>
      </div>

      {/* SUBMISSIONS LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Received ({submissions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <Clock className="mx-auto h-10 w-10 mb-3 opacity-20" />
              <p>No students have submitted this assignment yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions?.map((sub) => {
                const submittedAt = new Date(sub.submitted_at)
                const isLate = submittedAt > dueDate

                return (
                  <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    
                    <div className="flex items-start gap-4 mb-4 sm:mb-0">
                      <div className="bg-blue-100 p-2.5 rounded-full mt-1">
                        <FileText className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{sub.profiles?.full_name || 'Unknown Student'}</h4>
                        <p className="text-xs text-gray-500">{sub.profiles?.email}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
                            Submitted: {submittedAt.toLocaleDateString()} {submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isLate && (
                            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 font-medium">Late</span>
                          )}
                          {sub.grade && (
                            <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded flex items-center font-medium">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Graded: {sub.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" asChild>
                        <a href={sub.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="mr-2 h-4 w-4" /> View Work
                        </a>
                      </Button>
                      
                      <GradeSubmissionDialog 
                        submission={sub} 
                        courseId={courseId} 
                        assignmentId={assignmentId} 
                        studentName={sub.profiles?.full_name} 
                      />
                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}