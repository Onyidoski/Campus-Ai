import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, MessageSquare, Users, BookOpen, Settings, Download, Calendar, Paperclip, Trash2 } from 'lucide-react'
import { UploadMaterialDialog } from '@/components/dashboard/upload-material-dialog'
import { AddAssignmentDialog } from '@/components/dashboard/add-assignment-dialog'
import { EditAssignmentDialog } from '@/components/dashboard/edit-assignment-dialog'
import { deleteMaterial, deleteAssignment } from './actions'

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }> | { courseId: string }
}) {
  const supabase = await createClient()
  
  const resolvedParams = await params
  const courseId = resolvedParams.courseId

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

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
             <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                {course.code}
             </span>
             <span className="text-sm">• {course.level} Level</span>
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
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="stream">Stream</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>

        {/* 1. STREAM TAB */}
        <TabsContent value="stream" className="mt-6 space-y-4">
           <Card>
             <CardHeader>
               <CardTitle>Class Stream</CardTitle>
               <CardDescription>Latest announcements and discussions.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="text-center py-10 text-muted-foreground">
                 <MessageSquare className="mx-auto h-10 w-10 mb-3 opacity-20" />
                 <p>No announcements yet.</p>
                 {isLecturer && <Button variant="link" className="mt-2">Post something</Button>}
               </div>
             </CardContent>
           </Card>
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
                      {/* DOWNLOAD BUTTON */}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50" asChild>
                        <a href={file.file_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      
                      {/* DELETE BUTTON */}
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

                      {/* EDIT & DELETE BUTTONS (Lecturer Only) */}
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
                    
                    <div className="px-6 pb-4 pt-2 mt-auto border-t bg-gray-50/50 rounded-b-xl">
                      <Button variant="outline" className="w-full text-sm h-8">
                        {isLecturer ? 'View Submissions' : 'Submit Work'}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* 4. PEOPLE TAB */}
        <TabsContent value="people" className="mt-6">
           <Card>
             <CardHeader>
               <CardTitle>Students</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-center text-muted-foreground py-6">
                 <Users className="mx-auto h-10 w-10 mb-3 opacity-20" />
                 <p>No students enrolled yet.</p>
               </div>
             </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}