import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, MessageSquare, Users, BookOpen, Settings, Download, Calendar, Paperclip, Trash2, Megaphone, AlertCircle } from 'lucide-react'
import { UploadMaterialDialog } from '@/components/dashboard/upload-material-dialog'
import { AddAssignmentDialog } from '@/components/dashboard/add-assignment-dialog'
import { EditAssignmentDialog } from '@/components/dashboard/edit-assignment-dialog'
import { SubmitAssignmentDialog } from '@/components/dashboard/submit-assignment-dialog'
import { AddAnnouncementDialog } from '@/components/dashboard/add-announcement-dialog'
import { AITutorSheet } from '@/components/dashboard/ai-tutor-sheet'
import { deleteMaterial, deleteAssignment, deleteAnnouncement } from './actions'

export default async function CourseDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }> | { courseId: string }
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  
  const resolvedParams = await params
  const courseId = resolvedParams.courseId

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const activeTab = (resolvedSearchParams.tab as string) || "materials"

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course, error } = await supabase
    .from('courses')
    .select('*, profiles:lecturer_id(full_name)')
    .eq('id', courseId)
    .single()

  if (error || !course) {
    notFound()
  }

  const isLecturer = course.lecturer_id === user.id

  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('due_date', { ascending: true })

  const { data: userSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', user.id)

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, profiles:lecturer_id(full_name)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  let enrolledStudents: any[] = []
  if (isLecturer) {
    const { data } = await supabase
      .from('enrollments')
      .select('enrolled_at, profiles:student_id(full_name, email, department, academic_level)')
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false })
    
    enrolledStudents = data || []
  }

  return (
    <div className="space-y-6 relative pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
             <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                {course.code}
             </span>
             <span className="text-sm">• {course.level} Level</span>
             
             {isLecturer && course.invite_code && (
                <div className="flex items-center ml-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5" title="Share this code with your students">
                  <span className="text-blue-500 mr-1 select-none">Code:</span>
                  <span className="font-mono font-bold select-all">{course.invite_code}</span>
                </div>
             )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground mt-1">
            Lecturer: {course.profiles?.full_name || 'Unknown'}
          </p>
        </div>

        {isLecturer && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
            <UploadMaterialDialog courseId={courseId} />
          </div>
        )}
      </div>

      {/* TABS NAVIGATION */}
      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className={`grid w-full ${isLecturer ? 'grid-cols-4 lg:w-[500px]' : 'grid-cols-3 lg:w-[400px]'}`}>
          <TabsTrigger value="stream">Stream</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          {isLecturer && <TabsTrigger value="people">People</TabsTrigger>}
        </TabsList>

        {/* 1. STREAM TAB */}
        <TabsContent value="stream" className="mt-6 space-y-4">
          
          {isLecturer && (
            <div className="flex justify-end mb-4">
              <AddAnnouncementDialog courseId={courseId} />
            </div>
          )}

          {announcements?.length === 0 ? (
           <Card>
             <CardContent className="py-12">
               <div className="text-center text-muted-foreground">
                 <MessageSquare className="mx-auto h-12 w-12 mb-3 opacity-20" />
                 <h3 className="text-lg font-medium text-gray-900">Class Stream is Empty</h3>
                 <p className="mt-1">No announcements have been posted yet.</p>
               </div>
             </CardContent>
           </Card>
          ) : (
            <div className="space-y-4">
              {announcements?.map((announcement) => {
                const date = new Date(announcement.created_at)
                
                return (
                  <Card key={announcement.id} className={`overflow-hidden transition-all ${
                    announcement.is_urgent ? 'border-l-4 border-l-red-500 bg-red-50/30' : ''
                  }`}>
                    <CardHeader className="pb-2 pt-4 flex flex-row items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          announcement.is_urgent ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {announcement.is_urgent ? <AlertCircle className="h-5 w-5" /> : <Megaphone className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{announcement.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      {isLecturer && (
                        <form action={deleteAnnouncement.bind(null, announcement.id, courseId)}>
                          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" title="Delete Announcement">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      )}
                    </CardHeader>
                    
                    <CardContent className="pt-2 pb-5">
                      {announcement.is_urgent && (
                        <Badge variant="destructive" className="mb-2">URGENT</Badge>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-800">
                        {announcement.content}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* 2. MATERIALS TAB */}
        <TabsContent value="materials" className="mt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Course Materials</h3>
          </div>
          
          {materials?.length === 0 ? (
            <Card>
               <CardContent className="py-10">
                 <div className="text-center text-muted-foreground">
                   <FileText className="mx-auto h-10 w-10 mb-3 opacity-20" />
                   <p>No materials uploaded yet.</p>
                   {isLecturer && <p className="text-sm">Use the upload button at the top to add your first file.</p>}
                 </div>
               </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {materials?.map((file) => (
                <Card key={file.id} className="flex flex-col p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-blue-50 p-2.5 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50" asChild>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      
                      {isLecturer && (
                        <form action={deleteMaterial.bind(null, file.id, courseId)}>
                          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete Material">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <h4 className="font-semibold text-sm line-clamp-1" title={file.title}>
                      {file.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1 font-medium">
                      {file.file_type} • Added recently
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="mt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Class Assignments</h3>
            {isLecturer && <AddAssignmentDialog courseId={courseId} />}
          </div>

          {assignments?.length === 0 ? (
           <Card>
             <CardContent className="py-10">
               <div className="text-center text-muted-foreground">
                 <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-20" />
                 <p>No assignments due.</p>
                 {isLecturer && <p className="text-sm mt-1">Click the button above to create one.</p>}
               </div>
             </CardContent>
           </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {assignments?.map((assignment) => {
                const dueDate = new Date(assignment.due_date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })
                
                return (
                  <Card key={assignment.id} className="flex flex-col hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-lg leading-tight">{assignment.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-orange-600">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {dueDate}
                        </CardDescription>
                      </div>

                      {isLecturer && (
                        <div className="flex items-center gap-1 -mt-1 -mr-2">
                          <EditAssignmentDialog assignment={assignment} courseId={courseId} />
                          
                          <form action={deleteAssignment.bind(null, assignment.id, courseId)}>
                            <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete Assignment">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {assignment.description || 'No additional instructions provided.'}
                      </p>
                      
                      {assignment.attachment_url && (
                        <div className="mt-4">
                          <Button variant="secondary" size="sm" className="h-8 text-xs font-medium" asChild>
                            <a href={assignment.attachment_url} target="_blank" rel="noopener noreferrer" download>
                              <Paperclip className="h-3.5 w-3.5 mr-1.5" /> View Attachment
                            </a>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    
                    <div className="px-6 pb-4 pt-3 mt-auto border-t bg-gray-50/50 rounded-b-xl">
                      {isLecturer ? (
                        <Button variant="outline" className="w-full text-sm h-8" asChild>
                          <Link href={`/dashboard/courses/${courseId}/assignments/${assignment.id}`}>
                            View Submissions
                          </Link>
                        </Button>
                      ) : (
                        (() => {
                          const submission = userSubmissions?.find(s => s.assignment_id === assignment.id)
                          
                          if (submission) {
                            return (
                              <div className="flex items-center gap-2">
                                <Button variant="secondary" className="flex-1 text-sm h-8 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" asChild>
                                  <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                                    View Your Submission
                                  </a>
                                </Button>
                                <SubmitAssignmentDialog courseId={courseId} assignmentId={assignment.id} isResubmit={true} />
                              </div>
                            )
                          }
                          
                          return <SubmitAssignmentDialog courseId={courseId} assignmentId={assignment.id} />
                        })()
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* 4. PEOPLE TAB (LECTURERS ONLY) */}
        {isLecturer && (
          <TabsContent value="people" className="mt-6">
             <Card>
               <CardHeader>
                 <div className="flex items-center justify-between">
                   <div>
                     <CardTitle>Enrolled Students</CardTitle>
                     <CardDescription>
                       {enrolledStudents.length} student{enrolledStudents.length === 1 ? '' : 's'} registered for this course
                     </CardDescription>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 {enrolledStudents.length === 0 ? (
                   <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg bg-gray-50/50">
                     <Users className="mx-auto h-10 w-10 mb-3 opacity-20" />
                     <p>No students enrolled yet.</p>
                     <p className="text-sm mt-1">Share your course invite code for students to join.</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {enrolledStudents.map((enrollment, idx) => {
                       const profile = enrollment.profiles
                       const initial = profile?.full_name?.charAt(0).toUpperCase() || 'S'
                       
                       return (
                         <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                           <div className="flex items-center gap-4 mb-2 sm:mb-0">
                             <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                               {initial}
                             </div>
                             <div>
                               <p className="font-semibold text-gray-900">{profile?.full_name || 'Unknown Student'}</p>
                               <p className="text-sm text-gray-500">{profile?.email}</p>
                             </div>
                           </div>
                           
                           <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                             <Badge variant="secondary" className="bg-gray-100 text-gray-700 whitespace-nowrap">
                               {profile?.department || 'N/A'} • {profile?.academic_level || 'N/A'} Lvl
                             </Badge>
                             <p className="text-xs text-gray-400 sm:mt-1">
                               Joined {new Date(enrollment.enrolled_at).toLocaleDateString()}
                             </p>
                           </div>
                         </div>
                       )
                     })}
                   </div>
                 )}
               </CardContent>
            </Card>
          </TabsContent>
        )}

      </Tabs>

      {/* NEW: The Floating AI Tutor Button */}
      <AITutorSheet courseId={courseId} />

    </div>
  )
}