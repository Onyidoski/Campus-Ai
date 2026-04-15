
# AI-POWERED CAMPUS ASSISTANT WITH INTEGRATED LEARNING SYSTEM

**A Project Proposal**

**Submitted to the Department of Computer Science, Faculty of Computing and Information Technology, Caleb University, Lagos, Nigeria**

**By**

[Your Full Name]

[Your Matric Number]

**Supervisor: Prof. Aregbesola**

**February, 2026**

---

## SUMMARY OF THE STUDY

The rapid evolution of educational technology has shown the limitations of fragmented campus systems that require students to move between multiple disconnected platforms just to access course materials, assignments, timetables, and announcements. This fragmentation often leads to missed deadlines, overlooked announcements, and a general lack of personalised academic support. This study aims to design and implement an AI-Powered Campus Assistant with an Integrated Learning System for Caleb University that addresses these challenges through a single, intelligent platform. The proposed system makes use of Artificial Intelligence, specifically a Retrieval-Augmented Generation (RAG) architecture powered by the Gemini large language model, to provide personalised, context-aware academic assistance. The system brings together a role-based AI chatbot, a Learning Management System (LMS), an AI study companion that can generate quizzes, flashcards, and summaries from uploaded course materials, embedded video conferencing for online classes, and a discussion forum. The development follows the Agile methodology using iterative sprints, and the system is built as a Progressive Web Application (PWA) using Next.js, Supabase (PostgreSQL), and Cloudflare R2 for file storage. Data collection involves administering structured questionnaires to a sample of students and lecturers at Caleb University to evaluate the system's usability, functionality, and effectiveness. This study contributes to the growing body of knowledge on AI-driven educational technology and shows how intelligent systems can improve learning outcomes, communication, and administrative efficiency within higher education institutions in Nigeria.

---

## CHAPTER ONE

## INTRODUCTION

### 1.1 Background to the Study

The integration of technology into education has changed the way students learn, interact with academic content, and communicate with their institutions. Over the past decade, Learning Management Systems (LMS) such as Moodle, Blackboard, and Google Classroom have become important tools for managing coursework, distributing materials, and conducting online assessments (Alturki & Aldraiweesh, 2021). However, despite the widespread use of these platforms, many educational institutions, especially in developing countries like Nigeria, still depend on fragmented systems that do not provide a unified academic experience for students and lecturers (Adeoye et al., 2020).

In a typical Nigerian university setting, students have to check multiple disconnected channels to find timetables, course materials, assignment deadlines, and campus announcements. Lecturers deal with similar issues when it comes to managing course content, keeping track of student submissions, and communicating with their students. This fragmentation leads to missed deadlines, overlooked announcements, and a general lack of proper academic support (Oyelere et al., 2021). The need for a centralised platform that brings all these academic functions together has become quite clear.

At the same time, Artificial Intelligence (AI) has started playing a bigger role in education. AI-powered chatbots, recommendation systems, and intelligent tutoring systems have shown real potential in making learning more personalised (Zawacki-Richter et al., 2019). The development of large language models (LLMs) such as OpenAI's GPT series and Google's Gemini has opened up even more possibilities, allowing systems that can understand natural language queries, generate study aids, summarise learning materials, and provide context-aware academic help (Kasneci et al., 2023).

One technique that has shown a lot of promise is Retrieval-Augmented Generation (RAG), which combines the generative abilities of LLMs with the ability to search through and reference specific documents, such as course textbooks and lecture notes, to produce accurate and contextually relevant responses (Lewis et al., 2020). This approach is particularly useful in educational settings where the accuracy of information really matters.

Progressive Web Applications (PWAs) have also become a practical option for delivering educational platforms. PWAs combine the accessibility of web applications with the performance and offline features that are usually associated with native mobile applications, making them well-suited for environments where internet connectivity is not always reliable (Tandel & Jamadar, 2018). Through service workers and local caching, PWAs allow students to access downloaded course materials even when they are not connected to the internet.

Given all these technological developments, this study sets out to design and implement an AI-Powered Campus Assistant with an Integrated Learning System. It is a web-based platform that brings together an AI chatbot, learning management features, an AI study companion, embedded online classes, and offline access to academic resources. The system is designed with Caleb University in mind and aims to make the academic experience better for students, lecturers, and administrators.

### 1.2 Statement of the Problem

Students in many Nigerian universities face real challenges because they have to use several disconnected platforms to handle their academic activities. Course materials might be shared through WhatsApp groups, assignments communicated through email, timetables posted on physical notice boards, and announcements passed around through informal channels. This leads to a number of serious problems:

1. **Information Overload and Missed Communications:** Students regularly miss important announcements, assignment deadlines, and schedule changes because information is spread across multiple channels with no single source of truth (Adeoye et al., 2020).

2. **Lack of Personalised Academic Support:** Existing campus systems rarely provide intelligent, personalised help. Students who are struggling with specific topics have very limited access to academic assistance outside of scheduled lectures and office hours (Zawacki-Richter et al., 2019).

3. **Poor Integration of Learning Tools:** Most institutions rely on separate systems for course management, online classes, and discussions. The lack of connection between these tools creates unnecessary friction in the learning process and reduces efficiency for both students and lecturers (Alturki & Aldraiweesh, 2021).

4. **Limited Offline Access to Learning Materials:** A lot of students, particularly those in developing regions, deal with unreliable internet connectivity. Most existing platforms need a constant internet connection, which makes it hard for students to access course materials when they are offline (Oyelere et al., 2021).

5. **No AI-Driven Study Assistance:** While AI technologies have shown plenty of promise in improving learning outcomes, most campus platforms do not include AI-powered features like automated quiz generation, flashcard creation, or document-based question answering (Kasneci et al., 2023).

These problems collectively affect students' academic performance and overall experience, and they highlight the need for a centralised, intelligent campus platform that addresses all of these gaps.

### 1.3 Objectives of the Study

The main objective of this study is to design and implement an AI-Powered Campus Assistant with an Integrated Learning System for Caleb University.

The specific objectives are to:

1. Develop a role-based web application that provides different access levels and functionalities for students, lecturers, administrators, and parents.
2. Implement an AI-powered chatbot using Retrieval-Augmented Generation (RAG) that gives personalised, context-aware academic assistance based on uploaded course materials.
3. Build a Learning Management System (LMS) that allows lecturers to upload course materials, create assignments, and manage coursework, while letting students access and submit assignments easily.
4. Develop an AI Study Companion that can generate quizzes, flashcards, and summaries from uploaded academic materials to support self-directed learning.
5. Integrate an embedded video conferencing solution for scheduling and holding online classes within the platform.
6. Set up a discussion forum for each course to encourage academic interaction between students and lecturers.
7. Provide offline access to downloaded course materials through Progressive Web Application (PWA) technology and local browser storage.
8. Evaluate the usability and effectiveness of the system through structured questionnaires given to students and lecturers at Caleb University.

### 1.4 Research Questions

The following research questions guide this study:

1. How can an AI-powered chatbot using Retrieval-Augmented Generation (RAG) be effectively built into a campus learning management system to provide personalised academic assistance?
2. To what extent does the AI Study Companion (quiz generation, flashcards, and summaries) improve students' self-directed learning experience?
3. How does bringing multiple academic tools (LMS, chatbot, online classes, discussion forums) together into a single platform affect the efficiency of academic communication and information access for students and lecturers?
4. How well does the Progressive Web Application (PWA) approach work in providing offline access to course materials for students with limited internet connectivity?
5. What is the overall usability and user satisfaction level of the AI-Powered Campus Assistant as seen by students and lecturers at Caleb University?

### 1.5 Research Hypotheses

The following hypotheses are formulated for this study:

**H₁:** The integration of an AI-powered chatbot with RAG capabilities into a campus learning system significantly improves students' ability to access relevant academic information compared to traditional methods.

**H₀:** The integration of an AI-powered chatbot with RAG capabilities into a campus learning system does not significantly improve students' ability to access relevant academic information compared to traditional methods.

**H₂:** Students who use the AI Study Companion features (quizzes, flashcards, summaries) show higher engagement in self-directed learning compared to those who do not use AI-assisted study tools.

**H₀:** Students who use the AI Study Companion features do not show higher engagement in self-directed learning compared to those who do not use AI-assisted study tools.

**H₃:** A unified campus platform with integrated learning management, AI assistance, and offline access significantly increases user satisfaction among students and lecturers.

**H₀:** A unified campus platform with integrated learning management, AI assistance, and offline access does not significantly increase user satisfaction among students and lecturers.

### 1.6 Rationale / Justification of the Study

The motivation for this study comes from the noticeable gap between the technological capabilities that exist today and the systems that are actually being used in many Nigerian universities. Even though AI and educational technology have advanced significantly on a global scale, most institutions in Nigeria still use fragmented, non-intelligent systems that do not take advantage of modern AI to support learning (Adeoye et al., 2020).

This study is justified by the following needs:

1. **Bridging the technology gap:** By developing a system that applies recent AI techniques (specifically RAG-based chatbots and LLMs) within a Nigerian university context, this study shows that advanced educational technology is not only possible but also practical for local institutions.

2. **Improving academic efficiency:** A unified platform that brings together course management, assignments, announcements, online classes, and AI-powered study tools removes the problems caused by using multiple disconnected systems.

3. **Encouraging self-directed learning:** The AI Study Companion feature, which generates quizzes, flashcards, and summaries from course materials, pushes students to engage more actively with their academic content outside of lectures.

4. **Dealing with connectivity issues:** By building the system as a Progressive Web Application with offline capabilities, the project directly tackles the issue of poor internet access that many Nigerian students face.

5. **Contributing to academic research:** This project adds to the growing research on AI in education, providing a practical example of how RAG-based AI systems can be used in campus learning platforms.

### 1.7 Scope of the Study

This study focuses on the design, development, and evaluation of an AI-Powered Campus Assistant with an Integrated Learning System. The system covers the following areas:

1. **User Roles:** The system supports four user roles: Students, Lecturers, Administrators, and Parents (with limited access). Each role has its own set of permissions and access levels within the platform.

2. **AI Chatbot:** The system includes a conversational AI chatbot powered by Google's Gemini LLM and a RAG architecture. The chatbot answers academic questions by pulling relevant information from uploaded course materials stored as vector embeddings.

3. **Learning Management:** Lecturers can upload course materials (PDFs, slides, videos), create assignments with deadlines, and post announcements. Students can access materials, submit assignments, and check their grades.

4. **AI Study Companion:** The system generates mini-quizzes, flashcards, and summaries from uploaded course materials using AI. These features are meant to help with self-study and revision.

5. **Online Classes:** The system uses an embedded video conferencing solution (Jitsi Meet) for scheduling and running online classes directly within the platform.

6. **Discussion Forum:** Each course has its own discussion board where students can ask questions and lecturers can respond.

7. **Offline Access:** The system is built as a Progressive Web Application (PWA), which means students can download and view course materials even without an internet connection.

**Limitations:** This study is limited to Caleb University for testing and evaluation purposes. The AI chatbot's accuracy depends on the quality and completeness of the course materials that have been uploaded. The system is not meant to fully replace established LMS platforms like Moodle or Blackboard, but rather to offer a focused, AI-enhanced alternative that fits the institution's specific needs.

### 1.8 Significance of the Study

This study is significant in a number of ways:

1. **To Students:** The system gives students a single platform where they can access course materials, assignments, timetables, and announcements. The AI chatbot and study companion provide personalised, on-demand academic help, which makes the learning experience better overall. Offline access means that students with poor internet can still continue studying without interruptions.

2. **To Lecturers:** The platform makes course management easier by providing tools to upload materials, create assignments, post announcements, and hold online classes, all from one place. The discussion forum also allows for easier academic interaction with students.

3. **To Caleb University:** The system serves as a pilot project that shows what is possible with AI-driven educational technology at the university. It positions the institution as one that is open to adopting modern campus technology.

4. **To the Academic Community:** This study adds to the research on applying Artificial Intelligence, particularly Retrieval-Augmented Generation and large language models, in educational settings. The findings and implementation details can be a useful reference for future research and development in AI-powered learning systems.

5. **To Software Developers:** The project provides a real-world example of building a full-stack AI-integrated web application using modern technologies like Next.js, Supabase, and the Gemini API. The design choices and challenges covered in this study can be helpful for developers working on similar projects.

---

## CHAPTER THREE

## METHODOLOGY

### 3.1 Study Design

This study uses the **Agile Software Development Methodology** for the design and implementation of the AI-Powered Campus Assistant with Integrated Learning System. The Agile methodology was chosen because it supports iterative and incremental development, meaning the system can be built and improved in successive cycles (sprints) based on regular testing and feedback (Sommerville, 2016).

The development process follows these main phases:

1. **Requirements Gathering and Analysis:** The functional and non-functional requirements of the system were identified by reviewing existing campus learning systems, looking at user needs, and putting together a detailed product requirements document.

2. **System Design:** The system architecture, database schema, user interface wireframes, and data flow diagrams were designed based on what was identified during the requirements phase.

3. **Iterative Development (Sprints):** The system was built in sprints, with each sprint focusing on a particular set of features (for example, authentication, course management, AI chatbot, study companion). After each sprint, the completed features were tested and improved where necessary.

4. **Testing:** Each module went through unit testing and integration testing. Once the system was complete, it was put in front of a sample of students and lecturers who evaluated it using structured questionnaires.

5. **Deployment and Evaluation:** The system was deployed as a Progressive Web Application and made available to the evaluation participants. Feedback was collected and analysed to see how well the system performed in terms of usability and effectiveness.

The Agile methodology works well for this project because the system is made up of several independent modules (AI chatbot, LMS, study companion, online classes, discussion forum) that can be developed, tested, and put together one at a time.

### 3.2 Study Population

The study population is made up of students and lecturers in the Department of Computer Science, Faculty of Computing and Information Technology, Caleb University, Lagos, Nigeria. This population was chosen because:

1. Students and lecturers are the main users of the proposed system.
2. People in the Computer Science department are likely to have enough technical knowledge to use and evaluate a web-based learning platform effectively.
3. The department provides a manageable environment for testing the system before it could potentially be rolled out across the institution.

The study population includes undergraduate students across all academic levels (100 to 400 level) and lecturers within the department.

### 3.3 Determination of Sample Size

The sample size for this study was calculated using the **Taro Yamane formula** (Yamane, 1967), which is commonly used for determining sample sizes from a known population:

**n = N / (1 + N(e²))**

Where:
- **n** = required sample size
- **N** = total study population
- **e** = margin of error (0.05, which gives a 95% confidence level)

Given a total population of about 500 students and 15 lecturers in the Department of Computer Science (N = 515):

n = 515 / (1 + 515(0.05²))
n = 515 / (1 + 515(0.0025))
n = 515 / (1 + 1.2875)
n = 515 / 2.2875
n ≈ **225 respondents**

So the study targets at least **225 respondents** made up of both students and lecturers. This number is large enough to give a reasonable representation of the study population.

### 3.4 Sampling Technique

This study uses a **stratified random sampling technique**. The study population is split into two groups (strata):

1. **Stratum 1: Students** - further divided by academic level (100, 200, 300, and 400 level) so that each level is properly represented.
2. **Stratum 2: Lecturers** - selected from those who are actively teaching courses in the department.

Within each group, participants are picked randomly to avoid bias and to make sure the sample reflects the overall population. This method ensures that feedback is collected from students at every level as well as from lecturers (Creswell & Creswell, 2018).

### 3.5 Research Instrument

The main research instrument for this study is a **structured questionnaire** designed to assess the usability, functionality, and effectiveness of the AI-Powered Campus Assistant. The questionnaire has the following sections:

- **Section A: Demographic Information** - collects basic data about the respondent's role (student or lecturer), academic level, gender, and how familiar they are with AI tools.
- **Section B: System Usability** - looks at how easy the system is to use, how the navigation works, and the overall user interface. The items are adapted from the **System Usability Scale (SUS)** (Brooke, 1996).
- **Section C: AI Chatbot Evaluation** - checks how accurate, relevant, and helpful the AI chatbot's responses are.
- **Section D: AI Study Companion Evaluation** - assesses how useful the quiz generation, flashcard, and summary features are for studying.
- **Section E: Overall Satisfaction** - captures how satisfied the respondent is with the platform overall and whether they would keep using it.

The questionnaire uses a **five-point Likert scale** (1 = Strongly Disagree, 2 = Disagree, 3 = Neutral, 4 = Agree, 5 = Strongly Agree) for items in Sections B through E. A copy of the questionnaire is included in the Appendix.

The instrument was validated through **face validity** and **content validity** by having the project supervisor (Prof. Aregbesola) and other experts in the department review it and provide feedback. Reliability was checked using **Cronbach's Alpha**, with a target coefficient of 0.70 or higher, which indicates acceptable internal consistency (Tavakol & Dennick, 2011).

### 3.6 Inclusion / Exclusion Criteria

**Inclusion Criteria:**
- Registered undergraduate students in the Department of Computer Science, Caleb University.
- Lecturers who are currently teaching courses in the Department of Computer Science.
- Participants who have access to a device that can browse the web (smartphone, laptop, or desktop).
- Participants who give their informed consent to take part in the study.

**Exclusion Criteria:**
- Students and staff from other departments who would not be direct users of the system.
- Anyone who does not give informed consent.
- Participants who cannot access the system because of device or connectivity problems during the evaluation period.

### 3.7 Method and Analysis of Data

Data collected from the structured questionnaires will be analysed using both **descriptive and inferential statistical methods**:

1. **Descriptive Statistics:** Frequency counts, percentages, mean scores, and standard deviations will be used to summarise the demographic details of respondents and their answers to the Likert-scale questions.

2. **Inferential Statistics:** The research hypotheses will be tested using the following statistical tests:
   - **Independent samples t-test:** To compare the average satisfaction scores between students and lecturers.
   - **Chi-square test:** To look at whether there is a link between demographic variables and user satisfaction levels.
   - **One-sample t-test:** To check whether the average usability score is significantly above the neutral point (3.0 on the Likert scale).

3. **Data Presentation:** Results will be shown using frequency tables, bar charts, and pie charts so that the findings are easy to understand.

All statistical analyses will be carried out using **SPSS (Statistical Package for the Social Sciences)** at a significance level of **0.05 (p < 0.05)**.

### 3.8 Ethical Consideration

The following ethical principles were followed throughout this study:

1. **Informed Consent:** All participants received an informed consent form that explained what the study is about, what their participation involves, the fact that it is completely voluntary, and their right to pull out at any point without any consequences. Only those who signed the consent form were included.

2. **Confidentiality and Anonymity:** Participants' personal information was kept confidential. Questionnaire responses were collected anonymously, and no names or identifying details were connected to individual responses in the analysis or the final report.

3. **Data Protection:** All data collected during the study, including questionnaire responses and any data created within the platform during testing, was stored securely and only the researcher had access to it. The system itself uses role-based access control and data encryption to keep user data safe.

4. **No Harm:** Taking part in this study did not pose any physical, psychological, or academic risk. The evaluation simply involved using a web-based platform and filling out a questionnaire.

5. **Ethical Approval:** Ethical clearance for this study was gotten from the relevant departmental and institutional review committees at Caleb University before data collection began.

### 3.9 Potential Value of Results

The results of this study are expected to provide the following value:

1. **A working AI-powered campus system** that can act as a starting point for wider adoption at Caleb University and at other institutions with similar needs.

2. **Real evidence** on how effective and usable AI-driven learning tools (chatbots, study companions) are within a Nigerian university setting, adding to the limited research on AI in education in developing countries.

3. **A practical example** of how modern technologies, including large language models, Retrieval-Augmented Generation, Progressive Web Applications, and vector databases, can be used to solve real educational problems.

4. **Useful guidelines and recommendations** for educational institutions that want to set up AI-powered learning management systems, based on the feedback and evaluation results from this study.

5. **A reference project** for software developers and researchers who are interested in building AI-integrated educational platforms using technologies like Next.js, Supabase, Gemini API, and pgvector.

### 3.10 Time-Frame

> **[To be added by the student]**
>
> A Gantt chart or table showing the project timeline (e.g., literature review period, development sprints, testing phase, report writing, and submission deadline) should be put here.

### 3.11 Funding / Budget

| S/N | Item | Estimated Cost (₦) |
|-----|------|-------------------|
| 1 | Internet subscription (6 months) | 60,000 |
| 2 | Gemini API usage (AI chatbot & study companion) | 30,000 |
| 3 | Cloudflare R2 storage (file hosting) | 15,000 |
| 4 | Supabase Pro plan (database & auth) | 25,000 |
| 5 | Vercel Pro plan (hosting & deployment) | 20,000 |
| 6 | Domain name registration | 5,000 |
| 7 | Printing and binding of project report | 15,000 |
| 8 | Miscellaneous expenses | 10,000 |
| | **Total** | **₦180,000** |

> **Note:** The budget figures above are estimates. Please adjust them to match your actual or expected expenses.

---

## REFERENCES

Adeoye, I. A., Adanikin, A. F., & Adanikin, A. (2020). COVID-19 and E-learning: Nigeria tertiary education system experience. *International Journal of Research and Innovation in Applied Science*, *5*(5), 28–31. https://doi.org/10.51584/IJRIAS.2020.5502

Alturki, U. T., & Aldraiweesh, A. (2021). Application of learning management system (LMS) during the COVID-19 pandemic: A sustainable acceptance model. *Sustainability*, *13*(4), 2033. https://doi.org/10.3390/su13042033

Brooke, J. (1996). SUS: A quick and dirty usability scale. In P. W. Jordan, B. Thomas, B. A. Weerdmeester, & I. McClelland (Eds.), *Usability evaluation in industry* (pp. 189–194). Taylor & Francis.

Creswell, J. W., & Creswell, J. D. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). SAGE Publications.

Kasneci, E., Seßler, K., Küchemann, S., Bannert, M., Dementieva, D., Fischer, F., Gasser, U., Groh, G., Günnemann, S., Hüllermeier, E., Krusche, S., Kutyniok, G., Michaeli, T., Nerdel, C., Pfeffer, J., Poquet, O., Sailer, M., Schmidt, A., Seidel, T., … Kasneci, G. (2023). ChatGPT for good? On opportunities and challenges of large language models for education. *Learning and Individual Differences*, *103*, 102274. https://doi.org/10.1016/j.lindif.2023.102274

Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*, *33*, 9459–9474. https://doi.org/10.48550/arXiv.2005.11401

Oyelere, S. S., Suhonen, J., Wajiga, G. M., & Sutinen, E. (2021). Design and implementation of MobileEdu m-learning application for computing education in Nigeria. *Learning and Teaching in Computing and Engineering*, 27–31. https://doi.org/10.1109/LaTiCE.2018.00013

Sommerville, I. (2016). *Software engineering* (10th ed.). Pearson Education.

Tandel, S. S., & Jamadar, A. (2018). Impact of progressive web apps on web app development. *International Journal of Innovative Research in Science, Engineering and Technology*, *7*(9), 9439–9444. https://doi.org/10.15680/IJIRSET.2018.0709021

Tavakol, M., & Dennick, R. (2011). Making sense of Cronbach's alpha. *International Journal of Medical Education*, *2*, 53–55. https://doi.org/10.5116/ijme.4dfb.8dfd

Yamane, T. (1967). *Statistics: An introductory analysis* (2nd ed.). Harper & Row.

Zawacki-Richter, O., Marín, V. I., Bond, M., & Gouverneur, F. (2019). Systematic review of research on artificial intelligence applications in higher education. *International Journal of Educational Technology in Higher Education*, *16*(1), 39. https://doi.org/10.1186/s41239-019-0171-0

---

## APPENDIX A: QUESTIONNAIRE

**QUESTIONNAIRE ON THE EVALUATION OF AI-POWERED CAMPUS ASSISTANT WITH INTEGRATED LEARNING SYSTEM**

**Department of Computer Science, Caleb University, Lagos**

---

**Dear Respondent,**

This questionnaire is designed to collect data for the evaluation of an AI-Powered Campus Assistant with Integrated Learning System, developed as a final year project in the Department of Computer Science, Caleb University. Your honest responses will be used strictly for academic purposes and will be treated with utmost confidentiality. Participation is voluntary, and you may withdraw at any time.

Thank you for your cooperation.

---

### SECTION A: DEMOGRAPHIC INFORMATION

*Please tick (✓) the appropriate option.*

1. **Gender:** [ ] Male  [ ] Female

2. **Role:** [ ] Student  [ ] Lecturer

3. **Academic Level (Students only):** [ ] 100 Level  [ ] 200 Level  [ ] 300 Level  [ ] 400 Level

4. **Have you used any AI-powered tool before (e.g., ChatGPT, Google Bard)?** [ ] Yes  [ ] No

5. **How would you rate your familiarity with Learning Management Systems?**
   [ ] Very Familiar  [ ] Familiar  [ ] Somewhat Familiar  [ ] Not Familiar

---

### SECTION B: SYSTEM USABILITY

*Please indicate your level of agreement with each statement using the scale below:*
**1 = Strongly Disagree | 2 = Disagree | 3 = Neutral | 4 = Agree | 5 = Strongly Agree**

| S/N | Statement | 1 | 2 | 3 | 4 | 5 |
|-----|-----------|---|---|---|---|---|
| 1 | The system was easy to navigate and use. | | | | | |
| 2 | I was able to find the information I needed quickly. | | | | | |
| 3 | The user interface was visually appealing and well-designed. | | | | | |
| 4 | The system loaded quickly and performed without noticeable delays. | | | | | |
| 5 | I could easily access course materials and assignments. | | | | | |
| 6 | The system worked well on my device (phone/laptop). | | | | | |

---

### SECTION C: AI CHATBOT EVALUATION

| S/N | Statement | 1 | 2 | 3 | 4 | 5 |
|-----|-----------|---|---|---|---|---|
| 7 | The AI chatbot understood my questions correctly. | | | | | |
| 8 | The chatbot provided accurate and relevant answers based on course materials. | | | | | |
| 9 | The chatbot responded in a reasonable time. | | | | | |
| 10 | The chatbot was helpful for answering academic questions. | | | | | |
| 11 | I would prefer using the AI chatbot over searching for information manually. | | | | | |

---

### SECTION D: AI STUDY COMPANION EVALUATION

| S/N | Statement | 1 | 2 | 3 | 4 | 5 |
|-----|-----------|---|---|---|---|---|
| 12 | The AI-generated quizzes were relevant to the course content. | | | | | |
| 13 | The flashcards helped me revise key concepts effectively. | | | | | |
| 14 | The AI-generated summaries accurately captured the main points of the materials. | | | | | |
| 15 | The study companion features improved my study experience. | | | | | |
| 16 | I would use the AI study companion regularly for exam preparation. | | | | | |

---

### SECTION E: OVERALL SATISFACTION

| S/N | Statement | 1 | 2 | 3 | 4 | 5 |
|-----|-----------|---|---|---|---|---|
| 17 | Overall, I am satisfied with the AI-Powered Campus Assistant. | | | | | |
| 18 | The platform is a significant improvement over the current system of accessing academic information. | | | | | |
| 19 | I would recommend this platform to other students/lecturers. | | | | | |
| 20 | I believe this system should be adopted by the university. | | | | | |

---

### SECTION F: OPEN-ENDED QUESTIONS

21. What features of the system did you find most useful?

    _________________________________________________________________________

22. What improvements would you suggest for the system?

    _________________________________________________________________________

23. Any additional comments or feedback?

    _________________________________________________________________________

---

**Thank you for your time and participation.**

