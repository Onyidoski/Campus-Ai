import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileText, MessageSquare, Users, BookOpen, Plus, Settings } from 'lucide-react'

// This fetch happens on the server
export default async function CourseDetailsPage({
  params,
}: {
  params: { courseId: string } // Next.js automatically passes the ID from the URL
}) {
  const supabase = await createClient()
  const { courseId } = await params // Await params in Next.js 15

  // 1. Get Current User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch Course Details
  const { data: course, error } = await supabase
    .from('courses')
    .select('*, profiles:lecturer_id(full_name)')
    .eq('id', courseId)
    .single()

  if (error || !course) {
    notFound() // Shows a 404 page if course doesn't exist
  }

  // 3. Check if user is the Lecturer for this specific course
  const isLecturer = course.lecturer_id === user.id

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

        {/* Action Buttons (Only for Lecturer) */}
        {isLecturer && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Upload Material
            </Button>
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

        {/* 1. STREAM TAB (Announcements) */}
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

        {/* 2. MATERIALS TAB (PDFs, Videos) */}
        <TabsContent value="materials" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Course Materials</h3>
            {/* Mobile "Upload" button could go here too */}
          </div>
          
          <Card>
             <CardContent className="py-10">
               <div className="text-center text-muted-foreground">
                 <FileText className="mx-auto h-10 w-10 mb-3 opacity-20" />
                 <p>No materials uploaded yet.</p>
                 <p className="text-sm">Upload PDFs and Slides here.</p>
               </div>
             </CardContent>
          </Card>
        </TabsContent>

        {/* 3. ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="mt-6">
           <Card>
             <CardContent className="py-10">
               <div className="text-center text-muted-foreground">
                 <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-20" />
                 <p>No assignments due.</p>
               </div>
             </CardContent>
          </Card>
        </TabsContent>

        {/* 4. PEOPLE TAB (Enrolled Students) */}
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