
Product Requirements Document (PRD)
Project Title
AI-Powered Campus Learning and Assistant System with Personalized Study Support

1. Introduction
1.1 Background
Many educational institutions rely on fragmented systems for learning management, communication, announcements, and online classes. Students often struggle to find accurate information about timetables, assignments, course materials, and urgent announcements. Lecturers also face challenges in managing course content, assignments, and student engagement efficiently.
With recent advancements in Artificial Intelligence, there is an opportunity to create a centralized, intelligent campus system that combines learning management features with an AI-powered assistant to improve accessibility, personalization, and academic support.

1.2 Problem Statement
Students lack a single platform to access academic information, course materials, assignments, and announcements.
Important announcements may be missed if students do not actively search for them.
Existing systems rarely provide personalized learning support or AI-driven study assistance.
Online classes and academic interactions are often poorly integrated with learning systems.

1.3 Proposed Solution
This project proposes an AI-powered campus learning system that integrates:
A role-based AI chatbot
A Learning Management System (LMS)
Online class scheduling via Google Meet API
Discussion forums
Personalized resource recommendations
AI study companion features
Offline access to learning materials
The system will serve students, lecturers, administrators, and parents through a unified platform.

2. Objectives of the System
2.1 Main Objective
To design and implement an AI-powered campus system that provides personalized academic assistance, learning management, and intelligent study support for students.
2.2 Specific Objectives
Provide role-based access for students, lecturers, parents, and administrators.
Enable students to access course materials, assignments, and timetables easily.
Allow lecturers to manage courses, upload materials, and schedule online classes.
Use AI to provide personalized responses, recommendations, and study assistance.
Ensure urgent announcements are automatically delivered to relevant users.
Support online learning through Google Meet integration.
Allow offline access to learning materials.

3. Target Users
3.1 Students
Access course materials and assignments
Submit assignments
Attend online classes
Ask academic questions
Receive personalized study support
3.2 Lecturers
Upload course materials
Create and manage assignments
Schedule online classes
Respond to student questions
Monitor student engagement
3.3 Administrators
Manage users and roles
Post campus-wide announcements
Oversee system usage
3.4 Parents (Limited Access)
View student academic information (optional)
Receive important announcements

4. Functional Requirements
4.1 Authentication & User Profiling
Secure login system
Role selection: Student, Lecturer, Parent, Admin
Student profile includes:
Course of study
Academic level (100–400)
Enrolled courses
Lecturer profile includes:
Courses taught
Levels handled

4.2 AI Chatbot Module
Conversational interface for academic and administrative queries
Personalized responses based on user role, course, and level
Example queries:
“What classes do I have today?”
“What assignments are due this week?”
“How much is school fees?”
Automatic reminders for:
Assignments
Exams
Online classes
Serves as an assistant, not a replacement for the LMS



4.3 Course Materials Management
Lecturers can upload:
PDFs
Slides
Videos
Materials are tagged by:
Course
Level (100–400)
Students can:
View materials online
Download materials for offline use

4.4 Assignment Management
Lecturers can:
Create assignments
Set deadlines
Upload assignment instructions
Students can:
View assignments
Upload submissions
Receive submission confirmation
System tracks:
Submission time
Late submissions
Grades and feedback

4.5 Online Classes (Google Meet Integration)
Lecturers schedule online classes via the portal
Backend uses Google Calendar API to:
Create meetings
Generate Google Meet links automatically
Students:
See scheduled classes in timetable
Join classes via “Join Class” button
AI chatbot sends reminders with meeting links


4.6 Announcements & Notifications
Admins and lecturers can post announcements
Announcements can be:
Campus-wide
Course-specific
Level-specific
Urgent announcements are:
Automatically pushed to students
Shown prominently on dashboard
Sent via chatbot notifications

4.7 Discussion Forum / Q&A
Each course has a dedicated discussion board
Students can post questions
Lecturers can reply directly
AI assists by:
Suggesting answers for common questions
Linking relevant course materials
Highlighting unanswered questions

4.8 Resource Recommendation System
AI recommends:
Relevant PDFs
Videos
Practice quizzes
Recommendations are personalized based on:
Courses enrolled
Past performance
Current progress
Displayed in:
Student dashboard
Chatbot responses

4.9 AI Study Companion
AI can generate:
Mini-quizzes
Flashcards
Summaries from uploaded materials
Manual interaction:
Students can type questions
Contextual interaction:
When a student opens a PDF, a sidebar appears
Sidebar shows suggested questions
Student taps a question → AI responds instantly
Enhances learning without requiring constant typing

4.10 Offline Access
Students can download:
PDFs
Slides
Videos
Materials are accessible offline
Useful for students with limited internet access

5. Non-Functional Requirements
5.1 Performance
Fast response time for chatbot queries
Efficient file loading and downloads
5.2 Security
Role-based access control
Secure authentication
Restricted access to course-specific content
5.3 Scalability
System should support growth in:
Number of users
Courses
Learning materials
5.4 Usability
Simple, intuitive interface
Mobile-friendly design
Clear navigation between chatbot and portal

6. System Architecture (High-Level)
Frontend: Web application (student & lecturer portal)
Backend: API server handling logic and database
Database: Stores users, courses, materials, assignments, discussions
AI Layer: Handles chatbot responses, recommendations, study companion
External Services: Google Meet / Google Calendar API

7. Expected Outcomes
Improved access to academic information
Reduced confusion about timetables, assignments, and announcements
Increased student engagement through AI-assisted learning
A unified platform for campus learning and communication


8. Technology Stack
8.1 Frontend (Progressive Web Application)
Next.js 14/15 (App Router): The core React framework used for routing, server-side rendering, and building the user interface.
Tailwind CSS & Shadcn UI: Used for rapid, accessible, and responsive UI design. Shadcn provides pre-built components (modals, accordions, inputs) to speed up development.
TypeScript: Ensures type safety and reduces runtime errors across the application.
@ducanh2912/next-pwa: A plugin to convert the Next.js application into a Progressive Web App (PWA). It handles Service Worker generation to cache the application shell (UI), allowing the app to load instantly even without an internet connection.
Dexie.js (IndexedDB Wrapper): A client-side database used to store large files (PDFs, Videos) directly in the user's browser. This enables the "True Offline Access" feature, allowing students to view downloaded course materials without data.
TanStack Query (React Query): Manages server state and caching. It ensures that if a user loses internet connection, the UI displays cached data (e.g., course lists, announcements) instead of a blank screen.
8.2 Backend & API
Next.js API Routes (Server Actions): Handles business logic, secure API endpoints, and server-side validation.
Supabase Edge Functions: Used for long-running tasks like processing uploaded PDFs for the AI (parsing and embedding) to avoid timeout limits on standard API routes.
8.3 Database & Authentication
Supabase (PostgreSQL): The primary relational database for storing user profiles, course data, assignments, and grades.
Supabase Auth: Handles secure user login (Email/Password) and session management.
Supabase Row Level Security (RLS): Enforces strict data access policies (e.g., "Students can only view their own grades," "Lecturers can only edit their own courses") at the database level.
Supabase Realtime: Enables instant updates for the Discussion Forum and Chatbot typing indicators.
8.4 Artificial Intelligence (RAG Architecture)
Gemini 2.5 Flash API: The core LLM used for the chatbot, summarization, and quiz generation. Chosen for its speed, low cost, and high context window.
Supabase pgvector: A vector extension for PostgreSQL. It stores "embeddings" (mathematical representations) of course materials. This enables Retrieval-Augmented Generation (RAG), allowing the AI to "read" specific pages of a textbook to answer student questions accurately.
LangChain / Vercel AI SDK: Middleware to manage the conversation history and stream AI responses smoothly to the frontend.
8.5 File Storage
Cloudflare R2: Used for storing heavy course materials (PDFs, Slides, Videos).
Reason for choice: Zero egress fees (bandwidth costs), making it significantly cheaper than AWS S3 for a media-heavy learning platform.
8.6 Online Classes & Video
Jitsi Meet React SDK: An open-source video conferencing tool embedded directly into the application.
Advantage: Allows students to join classes inside the platform without being redirected to an external Google Meet link. It supports screen sharing, chat, and hand-raising.
8.7 Security
Role-Based Access Control (RBAC): Implemented via middleware and database policies to segregate Student, Lecturer, and Admin permissions.
Data Encryption: All data is encrypted in transit (TLS) and at rest (PostgreSQL encryption).
8.8 Development & DevOps
Git & GitHub: Version control and collaboration.
Vercel: Cloud platform for hosting the Next.js application (Frontend & API).
Postman: For testing API endpoints.

9. Conclusion
This project demonstrates how Artificial Intelligence can be effectively integrated into campus systems to improve learning, communication, and academic support. By combining an AI chatbot, LMS features, online classes, and personalized study assistance, the system provides a modern, scalable solution for educational institutions.


