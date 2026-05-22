import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, BookOpen, Settings, Download, Calendar, Paperclip, Trash2, Brain, ClipboardList, Layers, FileSearch, Video, Clock, ArrowRight } from 'lucide-react'
import { UploadMaterialDialog } from '@/components/dashboard/upload-material-dialog'
import { AddAssignmentDialog } from '@/components/dashboard/add-assignment-dialog'
import { EditAssignmentDialog } from '@/components/dashboard/edit-assignment-dialog'
import { SubmitAssignmentDialog } from '@/components/dashboard/submit-assignment-dialog'
import { AITutorSheet } from '@/components/dashboard/ai-tutor-sheet'
import { deleteAssignment, deleteClass } from './actions'
import { StudyToolsPanel } from '@/components/dashboard/study/study-tools-panel'
import { ScheduleClassDialog } from '@/components/dashboard/schedule-class-dialog'
import { MaterialsTabContent } from '@/components/dashboard/materials-tab-content'
import { CourseStreamTab } from '@/components/dashboard/course-stream-tab'
import { CourseDiscussionsTab } from '@/components/dashboard/course-discussions-tab'

export default async function CourseDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()

  const resolvedParams = await params
  const courseId = resolvedParams.courseId

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const activeTab = (resolvedSearchParams.tab as string) || "materials"

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect admins to the admin courses page — this detail view is for students/lecturers
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userProfile?.role === 'admin') redirect('/dashboard/admin/courses')

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

  // Fetch discussion posts with author profiles and reply counts
  const { data: discussionPosts } = await supabase
    .from('discussion_posts')
    .select('*, profiles:author_id(full_name, role), discussion_replies(count)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  // Fetch online classes for this course
  const { data: onlineClasses } = await supabase
    .from('online_classes')
    .select('*, profiles:created_by(full_name)')
    .eq('course_id', courseId)
    .order('scheduled_at', { ascending: true })

  return (
    <div className="relative space-y-6 pb-24 sm:pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
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
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{course.title}</h1>
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
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-auto min-h-9 w-max max-w-none shrink-0 justify-start gap-0.5 p-1">
              <TabsTrigger value="stream" className="shrink-0 flex-none px-3">Stream</TabsTrigger>
              <TabsTrigger value="materials" className="shrink-0 flex-none px-3">Materials</TabsTrigger>
              <TabsTrigger value="assignments" className="shrink-0 flex-none px-3">Assignments</TabsTrigger>
              <TabsTrigger value="classes" className="shrink-0 flex-none px-3">Classes</TabsTrigger>
              <TabsTrigger value="discussions" className="shrink-0 flex-none px-3">Discussions</TabsTrigger>
              <TabsTrigger value="study" className="shrink-0 flex-none px-3">Study Tools</TabsTrigger>
              {isLecturer && (
                <TabsTrigger value="people" className="shrink-0 flex-none px-3">People</TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

        {/* 1. STREAM TAB */}
        <TabsContent value="stream" className="mt-6">
          <CourseStreamTab
            announcements={announcements || []}
            courseId={courseId}
            isLecturer={isLecturer}
          />
        </TabsContent>

        {/* 2. MATERIALS TAB */}
        <TabsContent value="materials" className="mt-6 space-y-4">
          <MaterialsTabContent
            materials={(materials || []) as any[]}
            courseId={courseId}
            isLecturer={isLecturer}
          />
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

        {/* 4. DISCUSSIONS TAB */}
        <TabsContent value="discussions" className="mt-6">
          <CourseDiscussionsTab posts={discussionPosts || []} courseId={courseId} />
        </TabsContent>

        {/* 5. ONLINE CLASSES TAB */}
        <TabsContent value="classes" className="mt-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Online Classes</h3>
            {isLecturer && <ScheduleClassDialog courseId={courseId} />}
          </div>

          {(() => {
            const now = new Date()
            const upcoming = onlineClasses?.filter((c: any) => c.status !== 'ended' && new Date(c.scheduled_at) >= now) || []
            const liveNow = onlineClasses?.filter((c: any) => c.status === 'live') || []
            const past = onlineClasses?.filter((c: any) => c.status === 'ended' || (c.status !== 'live' && new Date(c.scheduled_at) < now)) || []

            return (
              <>
                {/* LIVE NOW */}
                {liveNow.length > 0 && (
                  <div className="space-y-3">
                    {liveNow.map((cls: any) => {
                      const date = new Date(cls.scheduled_at)
                      return (
                        <Card key={cls.id} className="border-l-4 border-l-green-500 bg-green-50/30 overflow-hidden">
                          <CardContent className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="h-11 w-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <Video className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <h4 className="font-semibold text-gray-900">{cls.title}</h4>
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] uppercase tracking-wider">
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                                      Live Now
                                    </Badge>
                                  </div>
                                  {cls.description && <p className="text-sm text-gray-600 line-clamp-1">{cls.description}</p>}
                                  <p className="text-xs text-gray-400 mt-1">{cls.profiles?.full_name} • {cls.duration_minutes} min</p>
                                </div>
                              </div>
                              <Button asChild className="bg-green-600 hover:bg-green-700 shrink-0">
                                <Link href={`/dashboard/online-class/${cls.id}`}>
                                  <Video className="mr-2 h-4 w-4" /> Join Now
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* UPCOMING */}
                {upcoming.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Upcoming</h4>
                    {upcoming.filter((c: any) => c.status !== 'live').map((cls: any) => {
                      const date = new Date(cls.scheduled_at)
                      const isToday = date.toDateString() === now.toDateString()
                      const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString()
                      const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

                      return (
                        <Card key={cls.id} className="hover:shadow-md transition-all duration-200 overflow-hidden">
                          <CardContent className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                                  <Video className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{cls.title}</h4>
                                  {cls.description && <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">{cls.description}</p>}
                                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> {dateLabel}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span>{cls.duration_minutes} min</span>
                                    <span className="hidden sm:inline">• {cls.profiles?.full_name}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isLecturer ? (
                                  <>
                                    <Button size="sm" asChild>
                                      <Link href={`/dashboard/online-class/${cls.id}`}>
                                        Start Class <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                      </Link>
                                    </Button>
                                    <form action={deleteClass.bind(null, cls.id, courseId)}>
                                      <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete Class">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </form>
                                  </>
                                ) : (
                                  <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/online-class/${cls.id}`}>
                                      <Video className="mr-1.5 h-3.5 w-3.5" /> Join When Live
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* PAST CLASSES */}
                {past.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Past Classes</h4>
                    {past.map((cls: any) => {
                      const date = new Date(cls.scheduled_at)
                      return (
                        <Card key={cls.id} className="opacity-60 hover:opacity-80 transition-opacity">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                  <Video className="h-4 w-4 text-gray-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700">{cls.title}</h4>
                                  <p className="text-xs text-gray-400">
                                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-[10px]">Ended</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* EMPTY STATE */}
                {(!onlineClasses || onlineClasses.length === 0) && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-muted-foreground">
                        <Video className="mx-auto h-12 w-12 mb-3 opacity-20" />
                        <h3 className="text-lg font-medium text-gray-900">No Classes Scheduled</h3>
                        <p className="mt-1">{isLecturer ? 'Schedule your first live class session.' : 'Your lecturer hasn\'t scheduled any classes yet.'}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )
          })()}
        </TabsContent>

        {/* 6. STUDY TOOLS TAB */}
        <TabsContent value="study" className="mt-6">
          <StudyToolsPanel courseId={courseId} materials={(materials || []).map((m: any) => ({ id: m.id, title: m.title, file_name: m.file_name }))} />
        </TabsContent>

        {/* 6. PEOPLE TAB (LECTURERS ONLY) */}
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
      <AITutorSheet courseId={courseId} materials={(materials || []).map((m: any) => ({ id: m.id, title: m.title, file_name: m.file_name }))} />

    </div>
  )
}
