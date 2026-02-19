import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react'

export default async function GlobalAssignmentsPage() {
  const supabase = await createClient()

  // 1. Authenticate & get role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isLecturer = profile?.role === 'lecturer'

  let assignments: any[] = []
  let submissions: any[] = []

  if (isLecturer) {
    // LECTURERS: Fetch assignments from courses they created
    const { data: lecturerCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('lecturer_id', user.id)
    
    const courseIds = lecturerCourses?.map(c => c.id) || []

    if (courseIds.length > 0) {
      const { data } = await supabase
        .from('assignments')
        .select('*, courses(code, title)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true })
      assignments = data || []
    }
  } else {
    // STUDENTS: Fetch assignments from enrolled courses
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id)
    
    const courseIds = enrollments?.map(e => e.course_id) || []

    if (courseIds.length > 0) {
      // Get the assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*, courses(code, title)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true })
      assignments = assignmentsData || []

      // Get their submissions to see what is already completed
      const { data: submissionsData } = await supabase
        .from('submissions')
        .select('assignment_id, grade')
        .eq('student_id', user.id)
      submissions = submissionsData || []
    }
  }

  // 3. Categorize the assignments
  const now = new Date()
  const submittedIds = submissions.map(s => s.assignment_id)

  const completed = assignments.filter(a => submittedIds.includes(a.id))
  
  const pending = assignments.filter(a => !submittedIds.includes(a.id))
  const todo = pending.filter(a => new Date(a.due_date) >= now)
  const overdue = pending.filter(a => new Date(a.due_date) < now)

  // Reusable component for the assignment cards
  const AssignmentCard = ({ assignment, status }: { assignment: any, status: 'todo' | 'overdue' | 'completed' }) => {
    const dueDate = new Date(assignment.due_date)
    const formattedDate = dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    
    // Find if it was graded (for completed status)
    const submission = submissions.find(s => s.assignment_id === assignment.id)

    return (
      <Card className={`hover:shadow-md transition-all duration-200 border-l-4 ${
        status === 'todo' ? 'border-l-blue-500' : 
        status === 'overdue' ? 'border-l-red-500' : 'border-l-green-500'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start mb-1">
            <Badge variant="outline" className="text-xs bg-gray-50">{assignment.courses?.code}</Badge>
            {status === 'overdue' && <Badge variant="destructive" className="text-[10px] uppercase tracking-wider">Overdue</Badge>}
            {status === 'completed' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-[10px] uppercase tracking-wider border-none">Done</Badge>}
          </div>
          <CardTitle className="text-lg leading-tight">{assignment.title}</CardTitle>
          <CardDescription className={`flex items-center gap-1.5 mt-1 font-medium ${
            status === 'overdue' ? 'text-red-600' : status === 'completed' ? 'text-gray-500' : 'text-orange-600'
          }`}>
            <Calendar className="h-3.5 w-3.5" />
            Due: {formattedDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {assignment.description || 'No additional instructions provided.'}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="text-sm font-medium text-gray-700">
              {status === 'completed' && submission?.grade && (
                <span className="flex items-center text-green-700">
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Score: {submission.grade}
                </span>
              )}
            </div>
            
            <Button variant={status === 'completed' ? 'outline' : 'default'} size="sm" asChild>
              {/* THIS LINK NOW INCLUDES ?tab=assignments */}
              <Link href={`/dashboard/courses/${assignment.course_id}?tab=assignments`}>
                {isLecturer ? 'View Course' : status === 'completed' ? 'Review Work' : 'Go to Assignment'} 
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isLecturer ? 'All Course Assignments' : 'My Assignments'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isLecturer 
            ? 'Track deadlines and view all assignments across your courses.' 
            : 'Stay on top of your deadlines across all your enrolled courses.'}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
          <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No assignments yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mt-1">
            {isLecturer 
              ? "You haven't created any assignments for your courses." 
              : "You don't have any assignments due. Enjoy your free time!"}
          </p>
        </div>
      ) : (
        <Tabs defaultValue={isLecturer ? "todo" : (todo.length > 0 ? "todo" : "completed")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="todo" className="relative">
              To Do
              {todo.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{todo.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue
              {overdue.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs">{overdue.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
            </TabsTrigger>
          </TabsList>

          {/* 1. TO DO TAB */}
          <TabsContent value="todo" className="mt-6">
            {todo.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border">
                <CheckCircle2 className="mx-auto h-10 w-10 mb-3 text-green-300" />
                <p>You're all caught up! No upcoming assignments.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {todo.map(a => <AssignmentCard key={a.id} assignment={a} status="todo" />)}
              </div>
            )}
          </TabsContent>

          {/* 2. OVERDUE TAB */}
          <TabsContent value="overdue" className="mt-6">
            {overdue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border">
                <Clock className="mx-auto h-10 w-10 mb-3 opacity-20" />
                <p>Great job! You have no past-due assignments.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {overdue.map(a => <AssignmentCard key={a.id} assignment={a} status="overdue" />)}
              </div>
            )}
          </TabsContent>

          {/* 3. COMPLETED TAB */}
          <TabsContent value="completed" className="mt-6">
            {completed.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border">
                <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-20" />
                <p>{isLecturer ? 'No completed assignments yet.' : "You haven't completed any assignments yet."}</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {completed.map(a => <AssignmentCard key={a.id} assignment={a} status="completed" />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}