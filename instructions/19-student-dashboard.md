# 19 — Student Dashboard

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/19-student-dashboard.md and implement exactly what is described."

---

## What to Build
Student dashboard page — the first page students see after login.
Shows platform overview, module shortcuts, and mock test CTA.

---

## Reference Docs
- `design_reference/Section2_Student_Portal.html` — Reference 1 (Dashboard)
- `docs/md/theming.md` — CSS variables and typography tokens

---

## Important — CSS Variable and Typography Convention
Use semantic CSS variable names. Never hardcode hex values.
Use typography token classes. Never hardcode text-sm, font-bold etc directly.
Reference: docs/md/theming.md for all variable names and token classes.

---

## Prerequisites
- `15-frontend-foundation.md` complete
- `16-shared-components.md` complete
- Student layout with sidebar and topbar working
- Axios instance and TanStack Query configured
- Auth store working (user name available)

---

## File to Implement

**`src/app/(student)/dashboard/page.tsx`**
**Type:** Mix — outer shell Server Component, data sections Client Components

---

## API Calls Needed

### GET /api/student/dashboard-stats
This route does not exist yet in backend.
Tell Claude Code to also create this backend route.

**Backend route to create:**
````
GET /api/student/dashboard-stats
Auth: authenticate middleware
Controller: getStudentDashboardStats

What it returns:
{
  success: true,
  data: {
    studentName: string,
    totalAttempts: number,
    totalMockTests: number,
    questionCounts: {
      speaking: number,    — count of active speaking questions
      writing: number,     — count of active writing questions
      reading: number,     — count of active reading questions
      listening: number    — count of active listening questions
    },
    activeMockTests: number  — count of active mock test templates
  }
}

Backend logic:
1. Get student from req.user.userId
2. Count active questions per module:
   SpeakingQuestion.countDocuments({ isActive: true })
   WritingQuestion.countDocuments({ isActive: true })
   ReadingQuestion.countDocuments({ isActive: true })
   ListeningQuestion.countDocuments({ isActive: true })
3. Count active mock test templates:
   MockTestTemplate.countDocuments({ isActive: true })
4. Return combined data
````

Add route to a new file `src/routes/student.routes.ts`:
````
GET /api/student/dashboard-stats → authenticate, getStudentDashboardStats
````

---

## Page Structure

````
Dashboard Page
├── PageHeader (title: "Dashboard", subtitle: greeting)
├── Stats Row (4 cards)
├── Module Section Label
├── Module Cards Grid (4 cards)
└── Bottom Grid
    ├── Recent Activity Card (left)
    └── Mock Test CTA Card (right)
````

---

## Section 1 — Page Header

```typescript
Component: PageHeader (from shared components)

title: "Dashboard"
subtitle: "Welcome back, {studentName}. Your practice platform is ready."

studentName from Zustand auth store (user.name)
Show first name only: user.name.split(' ')[0]
```

---

## Section 2 — Stats Row

Four stat cards in a row.
Data from dashboard-stats API.

```typescript
Card 1:
  value: questionCounts.speaking + questionCounts.writing +
         questionCounts.reading + questionCounts.listening
  label: "Total Questions Available"
  subtext: "Across all modules"
  subtextColor: "muted"

Card 2:
  value: 20  — hardcoded (4 modules × avg 5 types = 20 question types)
  label: "Question Types"
  subtext: "Speaking, Writing, Reading, Listening"
  subtextColor: "muted"

Card 3:
  value: student.totalAttempts (from API)
  label: "Total Attempts"
  subtext: totalAttempts === 0 ? "Start practising today" : "Keep it up!"
  subtextColor: totalAttempts === 0 ? "muted" : "success"

Card 4:
  value: student.totalMockTests (from API)
  label: "Mock Tests Attempted"
  subtext: totalMockTests === 0 ? "Try your first mock test" : "All time"
  subtextColor: totalMockTests === 0 ? "muted" : "success"
```

---

## Section 3 — Module Cards

Section label: "Practice Modules" (text-label-lg, uppercase, letter-spacing)

Four module cards in a 4-column grid.

```typescript
Data from questionCounts in API response.

Speaking card:
  module: "speaking"
  questionCount: questionCounts.speaking
  href: "/speaking"

Writing card:
  module: "writing"
  questionCount: questionCounts.writing
  href: "/writing"

Reading card:
  module: "reading"
  questionCount: questionCounts.reading
  href: "/reading"

Listening card:
  module: "listening"
  questionCount: questionCounts.listening
  href: "/listening"

Each card shows:
  Module icon (emoji)
  Module name
  "{count} questions available" — if count > 0
  "No questions yet" — if count = 0 (muted text)
  Arrow indicator → bottom right
  Top border in module color

Use ModuleCard component from shared components.
Clicking navigates to module home page.
```

---

## Section 4 — Bottom Grid

Two cards side by side.

### Left Card — Recent Activity

```typescript
Title: "Recent Activity"

If totalAttempts = 0:
  Show EmptyState component:
    icon: "📊"
    title: "No attempts yet"
    description: "Start practising to see your activity here."

If totalAttempts > 0:
  Show simple message:
    "You have made {totalAttempts} total attempts across all modules."
  No detailed history shown (per platform decision — no per-attempt records)

Background: var(--bg-card)
Border: 1px solid var(--border-default)
Border radius: var(--radius-card)
Padding: 20px
```

---

### Right Card — Mock Test CTA

```typescript
Title: "Mock Tests"

Background: gradient from var(--brand-primary) to slightly lighter navy
Text on dark background — white/muted white

Description:
  "Take a full-length mock test covering all four modules
   under real exam time pressure."

Button: "Start Mock Test →"
  White background, navy text
  Links to /mock-tests

Mini stats grid (2x2):
  Stat 1: "18+" / "Questions"
  Stat 2: "90 min" / "Duration"
  Stat 3: activeMockTests + " tests" / "Available"
  Stat 4: "∞" / "Retakes"

If activeMockTests = 0:
  Button disabled
  Show note: "No mock tests available yet. Contact your instructor."
```

---

## Loading State

While dashboard-stats API is loading:
```typescript
Show skeleton loading state:
  Stats row: 4 skeleton cards (grey animated pulse)
  Module cards: 4 skeleton cards
  Bottom cards: 2 skeleton cards

Use Tailwind animate-pulse for skeleton effect
Background: var(--border-default) for skeleton blocks
```

---

## Error State

If API call fails:
```typescript
Show error message:
  Icon: ⚠️
  Title: "Could not load dashboard"
  Description: "Please refresh the page to try again."
  Button: "Refresh" — calls queryClient.invalidateQueries
```

---

## TanStack Query Setup

```typescript
const { data, isLoading, isError } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: () => api.get('/student/dashboard-stats').then(r => r.data.data),
  staleTime: 1000 * 60 * 2,  — 2 minutes
})
```

---

## Topbar Configuration

```typescript
Breadcrumb: ["Dashboard"]
Greeting: "Good morning/afternoon/evening, {firstName} 👋"

Time-based greeting:
  6am-12pm  → "Good morning"
  12pm-5pm  → "Good afternoon"
  5pm-10pm  → "Good evening"
  10pm-6am  → "Good evening"
```

---

## Sidebar Active State

When on dashboard: "Dashboard" item in sidebar shows active state
(blue background + left border accent)

---

## Responsive Layout

On mobile (< 768px):
  Stats row: 2 columns grid
  Module cards: 2 columns grid
  Bottom section: 1 column (stacked)
  Sidebar: hidden (hamburger menu or drawer)

On tablet (768px - 1024px):
  Stats row: 2 columns grid
  Module cards: 2 columns grid

On desktop (> 1024px):
  Stats row: 4 columns
  Module cards: 4 columns
  Bottom: 2 columns

---

## Expected Output When Done
- Dashboard loads with correct student name in greeting
- Stats cards show correct counts from API
- Module cards show correct question counts
- Clicking module card navigates to module home
- Mock test CTA links to /mock-tests
- Loading skeleton shows while data loads
- Error state shows if API fails
- Responsive on all screen sizes
- Sidebar shows Dashboard as active

---

## Verification Steps
1. Login as student → redirected to /dashboard
2. Dashboard loads → student name shown in greeting
3. Stats cards show correct numbers
4. Module cards show question counts (add a few questions via admin first)
5. Click Speaking card → navigates to /speaking
6. Click "Start Mock Test" → navigates to /mock-tests
7. Slow network test → skeleton loading shows
8. Check mobile view → 2-column layout
9. Check sidebar → Dashboard item highlighted

---

## Notes
- Page outer shell can be Server Component
- Data fetching section needs 'use client' (uses useQuery)
- Split into DashboardContent client component if needed
- User name comes from Zustand store — no extra API call needed
- totalAttempts and totalMockTests come from dashboard-stats API
- No detailed attempt history shown — per platform decision
- Mock test CTA disabled if no active templates available
- All colors via CSS variables — no hardcoded values

## Next Step
→ Give Claude Code `20-speaking-frontend.md`
