# 25 — Admin Portal

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/25-admin-portal.md and implement exactly what is described."

---

## What to Build
Complete Admin Portal frontend including:
- Admin dashboard
- Student management (list, add, edit, reset password, disable)
- Question management for all 4 modules (list, add, edit, delete)
- Mock test template management
- Admin settings page

---

## Reference Docs
- `design_reference/Section3_Admin_Portal.html` — all admin page designs
- `docs/md/authentication-blueprint.md` — admin flows
- `docs/md/speaking-module.md` — speaking question fields
- `docs/md/writing-module.md` — writing question fields
- `docs/md/reading-module.md` — reading question fields
- `docs/md/listening-module.md` — listening question fields
- `docs/md/mocktest-blueprint.md` — template fields
- `docs/md/theming.md` — CSS variables and typography tokens

---

## Important — CSS Variable and Typography Convention
Use semantic CSS variable names. Never hardcode hex values.
Use typography token classes. Never hardcode font sizes.
Reference: docs/md/theming.md for all names.

---

## Prerequisites
- `15-frontend-foundation.md` complete
- `16-shared-components.md` complete
- Admin layout with AdminSidebar working
- Backend admin routes all working (07 through 13)

---

## Section 1 — Admin Dashboard

**File:** `src/app/(admin)/admin/dashboard/page.tsx`
**Type:** Client Component

Reference: Section3_Admin_Portal.html — Reference 1

**API Call:**
````
GET /api/admin/dashboard-stats
New backend route needed.

Backend: getAdminDashboardStats
Returns:
{
  totalStudents: number,
  activeStudents: number,
  totalQuestions: number,
  attemptsToday: number,
  totalMockTestAttempts: number,
  recentLogins: Array<{
    id, name, email, lastActiveAt, isActive
  }>,
  lowestScoringQuestions: Array<{
    id, type, module, content, attemptCount, avgScore
  }>
}

Backend logic:
1. Count students: User.countDocuments({ role: 'student' })
2. Count active students: User.countDocuments({ role: 'student', isActive: true })
3. Count all questions across all 4 models
4. Count attempts today:
   Students where lastActiveAt >= start of today
   (approximate — counts students active today not exact attempts)
5. Sum totalMockTests across all students
6. Recent logins: last 10 students sorted by lastActiveAt desc
7. Lowest scoring: questions with attemptCount >= 5
   sorted by avgScore asc, limit 5, across all modules
   Include module field in response

Add route:
GET /api/admin/dashboard-stats → authenticate + authorize('admin'), getAdminDashboardStats
````

**Page Structure:**
````
PageHeader: title "Admin Dashboard", subtitle "Platform overview"

4 stat cards row:
  Card 1: totalStudents — "Total Students" — subtext: "{activeStudents} active"
  Card 2: totalQuestions — "Total Questions" — subtext: "Across all modules"
  Card 3: attemptsToday — "Active Today" — subtext: "Students active today"
  Card 4: totalMockTestAttempts — "Mock Tests Attempted" — subtext: "All time"

Bottom 2-column grid:

Left: "Recent Student Logins"
  List of up to 10 recent logins:
    Each row: avatar (initials), name, time ago, Active/Away badge
    Time ago: "2 min ago", "1 hr ago", "3 hrs ago"
    Active badge: green (lastActiveAt < 30 min ago)
    Away badge: grey (lastActiveAt >= 30 min ago)
  If no students: EmptyState

Right: "Lowest Scoring Questions"
  List of up to 5 lowest scoring questions:
    Rank number, question preview, module + attempts, avg score %
    Score color: green/amber/red based on score
  If no data: EmptyState "Not enough attempts yet"
````

---

## Section 2 — Student Management

### Students List Page

**File:** `src/app/(admin)/admin/students/page.tsx`
**Type:** Client Component

Reference: Section3_Admin_Portal.html — Reference 2

**API Calls:**
````
GET /api/admin/students → list all students
POST /api/admin/students → create student
PUT /api/admin/students/:id → update student
PATCH /api/admin/students/:id/reset-password → reset password
PATCH /api/admin/students/:id/status → toggle status
DELETE /api/admin/students/:id → delete student
````

**Page Structure:**
````
PageHeader:
  title: "Students"
  subtitle: "{total} students registered"
  actions: "+ Add Student" button

Search input (top of table):
  Filter students by name or email client-side

DataTable columns:
  Student (name + email stacked)
  Total Attempts
  Mock Tests
  Last Active
  Status (Active/Inactive pill)
  Actions (Edit, Reset Pwd, Disable/Enable, Delete)

Table rows:
  Name: font-weight 600, text-primary
  Email: text-secondary, text-label-md
  Last Active: "2 min ago" / "3 hrs ago" / "Never"
  Status: StatusToggle component (calls toggle status API)
  Actions:
    Edit button (blue pale)
    Reset Pwd button (amber pale)
    Disable/Enable button (red/green)
    Delete button (red — opens ConfirmModal)

Add Student:
  Opens slide-over panel or modal (not new page)
  Form fields:
    Full Name input
    Email Address input
    Temporary Password input
    Hint: "Student will be required to change this on first login."
  Submit: POST /api/admin/students
  On success: invalidate students query, close panel, show success toast

Edit Student:
  Same panel/modal, pre-filled with name + email only
  Submit: PUT /api/admin/students/:id

Reset Password:
  Opens small modal (ConfirmModal style)
  Input for new temporary password
  Submit: PATCH /api/admin/students/:id/reset-password
  On success: show toast "Password reset. Student must change it on next login."

Delete Student:
  ConfirmModal (isDanger=true)
  Title: "Delete this student?"
  Description: "{studentName}'s account will be permanently deleted."
  On confirm: DELETE /api/admin/students/:id
````

---

## Section 3 — Question Management (All 4 Modules)

All 4 question management pages follow the same pattern.
Build Speaking first — repeat same structure for Writing, Reading, Listening.

### Speaking Questions Page

**File:** `src/app/(admin)/admin/speaking/page.tsx`
**Type:** Client Component

Reference: Section3_Admin_Portal.html — Reference 3

**API Calls:**
````
GET /api/admin/speaking/questions?type={type}
POST /api/admin/speaking/questions
PUT /api/admin/speaking/questions/:id
DELETE /api/admin/speaking/questions/:id
PATCH /api/admin/speaking/questions/:id/status
````

**Page Structure:**
````
PageHeader:
  title: "Speaking Questions"
  actions: "+ Add Question" button

Question type tabs:
  5 tabs: Read Aloud | Repeat Sentence | Describe Image |
          Respond to Situation | Answer Short Question
  Active tab: var(--action-default) bg, white text
  Inactive: grey text, white bg

DataTable (changes per tab):
  # (index)
  Question Preview (first 80 chars)
  Attempts
  Avg Score (colored)
  Active (StatusToggle)
  Actions (Edit, Delete)

Add/Edit Question:
  Opens side panel
  Dynamic form based on selected question type tab:

  Read Aloud form:
    Passage Text (textarea)
    Speaking Time (number input, default 40)
    Preparation Time (number input, default 30)

  Repeat Sentence form:
    Sentence Text (textarea, single sentence)
    Speaking Time (number input, default 15)
    Hint: "Browser TTS will speak this sentence to student."

  Describe Image form:
    Image upload (drag-drop zone or file input)
      Preview shown after upload
      Accept: jpg, jpeg, png
      Max: 5MB
    Speaking Time (number input, default 40)
    Preparation Time (number input, default 25)

  Respond to Situation form:
    Situation Paragraph (textarea)
    Speaking Time (number input, default 40)
    Preparation Time (number input, default 30)

  Answer Short Question form:
    Question Text (input — TTS will speak this)
    Accepted Answers (dynamic list):
      Input field per answer
      "Add another answer" button
      Remove button per answer
      Min 1 answer required
    Speaking Time (number input, default 10)

Delete:
  ConfirmModal (isDanger=true)
  Warning for describe_image: "The image will also be deleted from storage."
````

---

### Writing Questions Page

**File:** `src/app/(admin)/admin/writing/page.tsx`

Same structure as Speaking.
2 tabs: Summarise Written Text | Write Essay

````
Add/Edit form:

Summarise Written Text:
  Passage Text (textarea, 200-300 words)
  Time Limit (number, default 600 seconds / shows as "10 minutes")

Write Essay:
  Essay Prompt (textarea)
  Time Limit (number, default 1200 seconds / shows as "20 minutes")

Time limit shown in minutes in UI but stored in seconds.
Convert: minutes × 60 when sending to backend.
Convert: seconds ÷ 60 when displaying.
````

---

### Reading Questions Page

**File:** `src/app/(admin)/admin/reading/page.tsx`

Same structure.
5 tabs: R&W Fill Blanks | MCQ Multiple | Reorder Paragraphs | Reading Fill Blanks | MCQ Single

````
Add/Edit forms:

R&W Fill in the Blanks:
  Passage Text with [BLANK] markers (textarea)
    Hint: "Type [BLANK] where each blank should appear"
    Auto-detect blank count from [BLANK] markers
  Word Pool (dynamic list):
    Input per word (correct + distractor words)
    "Add word" button
  Correct Answer Per Blank (auto-generated inputs):
    One input per detected blank
    Dropdown showing word pool options
    Admin selects correct word per blank

MCQ Multiple Answers:
  Passage Text (textarea)
  Question Text (input)
  Options (dynamic list):
    Each option: text input + "Correct?" checkbox
    Min 2 options, at least 1 correct
    "Add option" button

Re-order Paragraphs:
  Paragraphs in correct order (dynamic list):
    Each: label (auto A, B, C...) + text textarea
    Min 3 paragraphs
    Reorderable (drag to change order = change correct sequence)
    "Add paragraph" button
  Note: "Enter paragraphs in the CORRECT order. System shuffles for students."

Reading Fill in the Blanks:
  Passage Text with [BLANK] markers
  Per-blank options (auto-generated):
    For each detected blank:
      Correct answer input
      Wrong options (2-3 inputs)

MCQ Single Answer:
  Passage Text (textarea)
  Question Text (input)
  Options (dynamic list):
    Each: text input + radio "Correct?" (only one selectable)
    Min 2 options, exactly 1 correct
````

---

### Listening Questions Page

**File:** `src/app/(admin)/admin/listening/page.tsx`

Same structure.
8 tabs: one per question type.

````
ALL listening question forms include:
  Audio File upload (required):
    Drag-drop zone or file input
    Accept: mp3, wav, m4a
    Max: 5MB
    Show file name + size after upload
    Show existing audio player for edit mode
    "Replace audio" option in edit mode
  Play Limit select:
    Options: "Play once (recommended)" / "Unlimited replays"

Type-specific additional fields:

Summarise Spoken Text:
  Audio upload + Play limit only
  No other fields

MCQ Multiple Answers:
  Audio + Play limit
  Question Text
  Options (same as Reading MCQ Multiple)

Fill in the Blanks:
  Audio + Play limit
  Transcript with [BLANK] markers
  Correct word per blank (inputs auto-generated)
  Note: "Fuzzy matching — minor typos accepted"

Highlight Correct Summary:
  Audio + Play limit
  3-4 summary paragraphs (dynamic list)
  Mark exactly 1 as correct

MCQ Single Answer:
  Audio + Play limit
  Question Text
  Options (same as Reading MCQ Single)

Select Missing Word:
  Audio + Play limit
  Note: "Upload audio with beep already inserted at end"
  Options (short words/phrases, mark 1 correct)

Highlight Incorrect Words:
  Audio + Play limit
  Full transcript text (textarea)
  Mark incorrect words:
    After entering transcript text:
    Show transcript as clickable word list
    Admin clicks words that are DIFFERENT from audio
    Clicked words highlighted
    These become incorrectWordIndices
  Note: "Click the words in the transcript that DIFFER from the audio"

Write from Dictation:
  Audio + Play limit
  Correct Sentence (input — exact text spoken in audio)
````

---

## Section 4 — Mock Test Management

**File:** `src/app/(admin)/admin/mock-tests/page.tsx`
**Type:** Client Component

Reference: Section3_Admin_Portal.html — Reference 5

**API Calls:**
````
GET /api/admin/mock-tests
POST /api/admin/mock-tests
PUT /api/admin/mock-tests/:id
DELETE /api/admin/mock-tests/:id
PATCH /api/admin/mock-tests/:id/status
````

**Page Structure:**
````
PageHeader:
  title: "Mock Tests"
  subtitle: "Manage test templates"
  actions: "+ Create Template" button

DataTable columns:
  Template Name
  Total Questions
  Time Limit
  Attempts
  Avg Score (colored)
  Active (StatusToggle)
  Actions (Edit, Delete)

Create/Edit Template:
  Opens side panel or full section below table

Form fields:

  Template Name (input)
  Description (input)
  Total Time in minutes (number input)

  Questions Per Type section:
    For each module, show all question types with count input:

    Speaking:
      Read Aloud: [number input]
      Repeat Sentence: [number input]
      Describe Image: [number input]
      Respond to Situation: [number input]
      Answer Short Question: [number input]

    Writing:
      Summarise Written Text: [number input]
      Write Essay: [number input]

    Reading:
      R&W Fill in the Blanks: [number input]
      MCQ Multiple Answers: [number input]
      Re-order Paragraphs: [number input]
      Reading Fill in the Blanks: [number input]
      MCQ Single Answer: [number input]

    Listening:
      Summarise Spoken Text: [number input]
      MCQ Multiple Answers: [number input]
      Fill in the Blanks: [number input]
      Highlight Correct Summary: [number input]
      MCQ Single Answer: [number input]
      Select Missing Word: [number input]
      Highlight Incorrect Words: [number input]
      Write from Dictation: [number input]

    All count inputs: min 0, default 0
    Total questions shown: sum of all counts (auto-calculated)

    Hint: "Set count to 0 to exclude a question type from this template."

Delete Template:
  ConfirmModal (isDanger=true)
  Warning: "Students will no longer be able to take this test."
````

---

## Section 5 — Admin Settings

**File:** `src/app/(admin)/admin/settings/page.tsx`
**Type:** Client Component

Reference: Section3_Admin_Portal.html — Reference 6

Same layout as student settings page with:
  Admin account info card:
    Amber avatar circle with "AD" initials
    Name: "Admin"
    Email: admin email from auth store
    "Admin" badge (amber)

  Change password form:
    Current Password
    New Password
    Confirm New Password
    Submit: POST /api/auth/update-password

---

## Shared Admin Components

### Side Panel Component

Create `src/components/admin/SidePanel.tsx`

```typescript
'use client'

Props: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  width?: string  — default '480px'
}

Renders:
  Overlay backdrop (semi-transparent)
  Panel sliding in from right
  Header: title + close button
  Scrollable content area
  Used for all add/edit forms in admin portal

Animation:
  Slide in from right when opened
  Slide out to right when closed
  Tailwind transition classes
```

---

### Question Preview Cell

Create `src/components/admin/QuestionPreview.tsx`

```typescript
Props: {
  content: string
  maxLength?: number  — default 80
}

Renders:
  Truncated text: first {maxLength} chars + "..."
  Full text on hover (title attribute)
  For listening questions: "🎵 Audio question" if no text preview
```

---

### Audio Upload Component

Create `src/components/admin/AudioUpload.tsx`

```typescript
'use client'

Props: {
  onFileSelected: (file: File) => void
  existingAudioUrl?: string
  maxSizeMB?: number  — default 5
}

States:
  empty: show drag-drop zone
  selected: show file name + size + remove button
  existing: show audio player + "Replace" button

Drag and drop zone:
  Dashed border
  Music note icon
  "Click to upload or drag and drop"
  "MP3, WAV, M4A · Max 5MB"
  On click: open file picker
  On drop: validate type + size

File preview:
  Music note icon in blue box
  File name
  File size in KB/MB
  Remove button (red X)

Validation:
  Accept: .mp3, .wav, .m4a only
  Max size: 5MB
  On invalid: show error below zone
```

---

### Image Upload Component

Create `src/components/admin/ImageUpload.tsx`

```typescript
'use client'

Props: {
  onFileSelected: (file: File) => void
  existingImageUrl?: string
}

Similar to AudioUpload but:
  Shows image preview after selection
  Accept: .jpg, .jpeg, .png only
  On existing: shows current image with "Replace" button
```

---

## TanStack Query Patterns for Admin

```typescript
Students:
const { data, isLoading } = useQuery({
  queryKey: ['admin-students'],
  queryFn: () => api.get('/admin/students').then(r => r.data.data.students)
})

const createMutation = useMutation({
  mutationFn: (data) => api.post('/admin/students', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-students'] })
    closeSidePanel()
    toast.success('Student created successfully.')
  }
})

Speaking Questions (per type):
const { data } = useQuery({
  queryKey: ['admin-speaking-questions', activeTab],
  queryFn: () => api.get(`/admin/speaking/questions?type=${activeTab}`).then(r => r.data.data.questions)
})

Same pattern for writing, reading, listening, mock-tests.
```

---

## Form Validation Rules

```typescript
All admin forms validate before submit:

Student:
  name: required, non-empty
  email: required, valid email format
  temporaryPassword: required, min 6 chars

Speaking Read Aloud:
  content: required, non-empty
  speakingTime: required, number, min 5

Speaking Describe Image:
  imageFile: required (new) or existing
  speakingTime: required

Speaking Answer Short:
  content: required
  acceptedAnswers: min 1 non-empty answer

Listening all types:
  audioFile: required (new) or existing

Reading MCQ Multiple:
  passage: required
  question: required
  options: min 2, at least 1 marked correct

Mock Test Template:
  name: required
  totalTime: required, min 10
  At least 1 question type with count > 0
```

---

## Toast Notifications

Use shadcn toast for all admin actions:

```typescript
Success toasts (green):
  "Student created successfully."
  "Question added successfully."
  "Template saved."
  "Status updated."
  "Password reset successfully."

Error toasts (red):
  "Failed to save. Please try again."
  "A student with this email already exists."
  "Please fill in all required fields."

All toasts:
  Duration: 4 seconds
  Position: bottom-right
```

---

## Expected Output When Done
- Admin dashboard shows stats + recent logins + lowest scoring questions
- Students: list, add, edit, reset password, disable/enable, delete all work
- Speaking: 5 type tabs, add/edit/delete questions per type
- Writing: 2 type tabs, forms work correctly
- Reading: 5 type tabs, blank editor detects [BLANK] markers
- Listening: 8 type tabs, audio upload works for all types
- Mock tests: create template with per-type question counts
- All forms validate before submit
- Toast notifications on all actions
- ConfirmModal on all delete actions

---

## Verification Steps
1. Admin login → admin dashboard loads with stats
2. Students → add student → appears in list
3. Students → reset password → isFirstLogin reset (student forced to change)
4. Students → disable → student login blocked
5. Speaking → Read Aloud tab → add question → appears in list
6. Speaking → Describe Image → upload image → question created
7. Listening → Write Dictation → upload audio + correct sentence → created
8. Reading → Reorder → enter 3+ paragraphs → created
9. Mock Tests → create template with counts → template appears
10. Delete question → ConfirmModal appears → on confirm → deleted
11. Toggle status → StatusToggle updates immediately
12. All forms: submit with missing fields → validation errors shown

---

## Notes
- All admin pages use AdminSidebar (amber "Admin Panel" badge)
- Side panel used for all add/edit forms (not separate pages)
- Audio uploaded as multipart form data (FormData with axios)
- Image uploaded same way for describe_image
- [BLANK] markers auto-detected in passage text for fill blank types
- incorrectWordIndices generated by admin clicking words in transcript
- Time limits stored in seconds in backend, shown in minutes in UI
- Question type tabs re-fetch data when tab changes
- DataTable sortable by attempts and avg score (client-side sort)
- All delete actions require ConfirmModal confirmation
- Status toggle updates optimistically (UI first, revert on error)

## Next Step
→ Give Claude Code `26-integration-testing.md`
