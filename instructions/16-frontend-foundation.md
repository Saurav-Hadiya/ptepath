# 16 — Frontend Foundation

## What This Is

Claude Code instruction file.
Tell Claude Code: "Read instructions/15-frontend-foundation.md and implement exactly what is described."

---

## What to Build

## Important — CSS Variable Naming Convention

All CSS variables use semantic names based on PURPOSE not color value.
This means if a color changes in future, only the value changes — the name stays meaningful.

Variable naming pattern:

- --brand-\* Brand identity colors (primary, accent)
- --action-\* Interactive element colors (buttons, links)
- --bg-\* Background colors (page, card, subtle)
- --text-\* Text colors (primary, secondary, muted)
- --border-\* Border colors
- --feedback-\* Status colors (success, error, warning)
- --module-\* Module identity colors (speaking, writing, reading, listening)
- --radius-\* Border radius tokens
- --shadow-\* Box shadow tokens

Never use old color names like --color-navy or --color-blue.
Always use semantic names as defined in docs/md/theming.md.

Complete frontend foundation including:

- Next.js 15 project properly configured
- Global theming and CSS variables
- Fonts setup
- Axios instance with token refresh interceptor
- TanStack Query client setup
- Zustand auth store
- Root layout with providers
- Route guard components
- Base TypeScript types

---

## Reference Docs

- `docs/md/theming.md` — complete CSS variables, fonts, colors
- `docs/md/authentication-blueprint.md` — auth flow, token strategy
- `instructions/06-project-structure.md` — folder structure

---

## Prerequisites

- `06-project-structure.md` complete
- Next.js 15 initialized with TypeScript + Tailwind + App Router
- All packages installed including:
  - axios
  - zustand
  - @tanstack/react-query
  - @tanstack/react-query-devtools
  - @dnd-kit/core
  - @dnd-kit/sortable
  - @dnd-kit/utilities
  - shadcn/ui initialized with Slate base color
  - All shadcn components installed

---

## Files to Implement

### 1. `src/app/globals.css`

Add complete CSS variable token set from `docs/md/theming.md`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Brand ───────────────────────────────── */
    --brand-primary: #0f1b4c;
    --brand-accent: #f59e0b;

    /* ── Action ──────────────────────────────── */
    --action-default: #2563eb;
    --action-hover: #3b82f6;
    --action-subtle: #eff6ff;

    /* ── Background ──────────────────────────── */
    --bg-page: #f8faff;
    --bg-card: #ffffff;
    --bg-accent: #fffbeb;

    /* ── Text ────────────────────────────────── */
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-muted: #94a3b8;

    /* ── Border ──────────────────────────────── */
    --border-default: #e2e8f0;

    /* ── Feedback ────────────────────────────── */
    --feedback-success: #10b981;
    --feedback-success-bg: #ecfdf5;
    --feedback-error: #ef4444;
    --feedback-error-bg: #fef2f2;
    --feedback-warning: #f59e0b;
    --feedback-warning-bg: #fffbeb;

    /* ── Module Identity ─────────────────────── */
    --module-speaking: #2563eb;
    --module-writing: #7c3aed;
    --module-reading: #059669;
    --module-listening: #dc2626;

    /* ── Shape & Shadow ──────────────────────── */
    --radius-card: 12px;
    --radius-button: 8px;
    --radius-input: 8px;
    --radius-pill: 100px;
    --radius-modal: 16px;
    --shadow-card: 0 2px 8px rgba(15, 27, 76, 0.07);
    --shadow-hover: 0 8px 24px rgba(15, 27, 76, 0.12);
    --shadow-modal: 0 20px 60px rgba(15, 27, 76, 0.18);
    --shadow-button: 0 4px 12px rgba(37, 99, 235, 0.35);
  }

  body {
    font-family: var(--font-body);
    background-color: var(--color-off-white);
    color: var(--color-dark);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-display);
  }
}
```

## Typography Tokens — Add to tailwind.config.ts

Extend theme with these custom font size tokens.
All components must use these class names — never hardcode text-sm, text-base etc.

fontSize extension:
display-xl: 3.5rem, lineHeight 1.05, fontWeight 800, letterSpacing -1.5px
display-lg: 2.5rem, lineHeight 1.1, fontWeight 800, letterSpacing -1px
display-md: 1.75rem, lineHeight 1.15, fontWeight 700, letterSpacing -0.8px
display-sm: 1.25rem, lineHeight 1.2, fontWeight 700
body-lg: 1rem, lineHeight 1.75, fontWeight 400
body-md: 0.9rem, lineHeight 1.7, fontWeight 400
body-sm: 0.82rem, lineHeight 1.65, fontWeight 400
label-lg: 0.85rem, lineHeight 1.5, fontWeight 600
label-md: 0.78rem, lineHeight 1.5, fontWeight 600
label-sm: 0.72rem, lineHeight 1.4, fontWeight 600, letterSpacing 0.5px
score-xl: 4rem, lineHeight 1, fontWeight 900, letterSpacing -3px
score-lg: 2.4rem, lineHeight 1, fontWeight 800, letterSpacing -1px
score-md: 1.5rem, lineHeight 1, fontWeight 800

Usage:
Page title: className="text-display-lg font-display"
Section heading: className="text-display-md font-display"
Card title: className="text-display-sm font-display"
Body text: className="text-body-md"
Label/caption: className="text-label-sm"
Score large: className="text-score-xl font-display"

---

### 2. `src/app/layout.tsx` — Root Layout

Server Component (no 'use client').

```
- Import Outfit font (weights: 700, 800, 900) using next/font/google
- Import Inter font (weights: 400, 500, 600) using next/font/google
- Apply both fonts to html element using CSS variables
- Import globals.css
- Wrap children with:
  1. QueryClientProvider (TanStack Query)
  2. Toaster (shadcn toast notifications)
- Include ReactQueryDevtools in development only
- Set metadata: title 'PTEPath', description 'PTE Exam Practice Platform'
```

Font setup example:

```typescript
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
```

Apply to html:

```tsx
<html lang="en" className={`${outfit.variable} ${inter.variable}`}>
```

---

### 3. `src/lib/query-client.ts`

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

---

### 4. `src/lib/api.ts`

Axios instance with automatic token refresh.

```typescript
'use client'  — this file uses browser-only features

Create axios instance:
  baseURL: process.env.NEXT_PUBLIC_API_URL
  withCredentials: true  — sends httpOnly cookies automatically
  headers: { 'Content-Type': 'application/json' }

Request interceptor:
  Before every request:
  Get accessToken from Zustand auth store
  If token exists: add Authorization: Bearer <token> header

Response interceptor:
  On success: return response as-is
  On error (status 401):
    If error is from /api/auth/refresh: clear auth store, redirect to /login
    Otherwise:
      Try to call POST /api/auth/refresh (cookie sent automatically)
      If refresh succeeds: get new accessToken, update store, retry original request
      If refresh fails: clear auth store, redirect to /login
  On other errors: reject with error as-is
```

---

### 5. `src/store/auth.store.ts`

Zustand store for authentication state.

```typescript
User type:
{
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
}

Store state:
{
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

Store actions:
{
  setAuth: (user: User, accessToken: string) => void
    — sets user, accessToken, isAuthenticated: true

  clearAuth: () => void
    — sets user: null, accessToken: null, isAuthenticated: false

  setAccessToken: (token: string) => void
    — updates token only (used by refresh interceptor)

  setLoading: (loading: boolean) => void
}
```

---

### 6. `src/types/index.ts`

Define all shared TypeScript types:

```typescript
// User types
export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Auth types
export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: User;
  };
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// Score types
export interface ScoreBreakdown {
  score: number;
  displayScore: string;
  feedback: string;
}

// Module types
export type ModuleType = "speaking" | "writing" | "reading" | "listening";

// Speaking question types
export type SpeakingQuestionType =
  | "read_aloud"
  | "repeat_sentence"
  | "describe_image"
  | "respond_situation"
  | "answer_short";

// Writing question types
export type WritingQuestionType = "summarise_written_text" | "write_essay";

// Reading question types
export type ReadingQuestionType =
  | "rw_fill_blanks"
  | "mcq_multiple"
  | "reorder_paragraphs"
  | "reading_fill_blanks"
  | "mcq_single";

// Listening question types
export type ListeningQuestionType =
  | "summarise_spoken"
  | "mcq_multiple"
  | "fill_blanks"
  | "highlight_summary"
  | "mcq_single"
  | "select_missing"
  | "highlight_incorrect"
  | "write_dictation";

// Question base
export interface BaseQuestion {
  id: string;
  type: string;
  isActive: boolean;
  attemptCount: number;
  avgScore: number;
  createdAt: string;
}

// Mock test
export interface MockTestTemplate {
  id: string;
  name: string;
  description: string;
  totalTime: number;
  questionRules: Array<{
    module: ModuleType;
    type: string;
    count: number;
  }>;
  isActive: boolean;
  attemptCount: number;
  avgScore: number;
}
```

---

### 7. `src/hooks/useAuth.ts`

Client-side hook for auth operations.

```typescript
'use client'

Custom hook that provides:
  - login(email, password):
      POST /api/auth/login via api.ts
      On success: call setAuth() with user + accessToken
      On isFirstLogin: redirect to /change-password with firstLoginToken
      Return { success, error }

  - logout():
      POST /api/auth/logout via api.ts
      Call clearAuth()
      Redirect to /login

  - initAuth():
      Called on app load to restore session
      POST /api/auth/refresh via api.ts
      If success: call setAuth()
      If fail: call clearAuth()
      Used in layout to silently restore session on page refresh
```

---

### 8. Route Guard Components

Create `src/components/shared/ProtectedRoute.tsx`

```typescript
'use client'

Props: { children: React.ReactNode, requireRole?: 'student' | 'admin' }

Behaviour:
  - Check isAuthenticated from Zustand store
  - If isLoading: show full-page loading spinner
  - If not authenticated: redirect to /login
  - If requireRole provided and user.role !== requireRole:
      If admin tries student route: allow (admin can view student pages)
      If student tries admin route: redirect to /dashboard
  - If authenticated and role ok: render children
```

Create `src/components/shared/PublicRoute.tsx`

```typescript
'use client'

Props: { children: React.ReactNode }

Behaviour:
  - If authenticated and role = 'admin': redirect to /admin/dashboard
  - If authenticated and role = 'student': redirect to /dashboard
  - If not authenticated: render children (show public page)
```

---

### 9. Student Layout — `src/app/(student)/layout.tsx`

```typescript
'use client'

Wraps all student portal pages.
Uses ProtectedRoute with requireRole='student'.

Layout structure:
  <ProtectedRoute requireRole="student">
    <div className="flex h-screen">
      <Sidebar />           ← fixed left sidebar
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />          ← top navigation bar
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-off-white)]">
          {children}
        </main>
      </div>
    </div>
  </ProtectedRoute>
```

---

### 10. Admin Layout — `src/app/(admin)/layout.tsx`

```typescript
'use client'

Same structure as student layout.
Uses ProtectedRoute with requireRole='admin'.

<ProtectedRoute requireRole="admin">
  <div className="flex h-screen">
    <AdminSidebar />
    <div className="flex flex-col flex-1 overflow-hidden">
      <AdminTopbar />
      <main className="flex-1 overflow-y-auto p-6 bg-[var(--color-off-white)]">
        {children}
      </main>
    </div>
  </div>
</ProtectedRoute>
```

---

### 11. `src/components/shared/Sidebar.tsx` — Student Sidebar

```typescript
'use client'

Reference: design_reference/Section2_Student_Portal.html
Look at sidebar design in Reference 1 (Dashboard)

Implement:
  - PTEPath logo with amber accent
  - Student name + role display
  - Navigation sections:
    Main: Dashboard
    Modules: Speaking (badge: 5), Writing (badge: 2),
             Reading (badge: 5), Listening (badge: 8)
    Tests: Mock Tests
    Account: Settings
  - Active state: blue background + left border accent
  - Logout button at bottom
  - Width: 260px fixed
  - Background: var(--color-navy)
  - Text: white with opacity variations

Use Next.js Link for navigation.
Use usePathname() to determine active route.
Logout calls useAuth().logout()
```

---

### 12. `src/components/shared/AdminSidebar.tsx` — Admin Sidebar

```typescript
'use client'

Reference: design_reference/Section3_Admin_Portal.html
Look at sidebar in Reference 1 (Admin Dashboard)

Same structure as student sidebar with:
  - "Admin Panel" amber badge below logo
  - Navigation sections:
    Overview: Dashboard
    Students: Students
    Questions: Speaking, Writing, Reading, Listening
    Tests: Mock Tests
    Account: Settings
  - Same styling as student sidebar
```

---

### 13. `src/components/shared/Topbar.tsx`

```typescript
'use client'

Reference: design_reference/Section2_Student_Portal.html

Props: { breadcrumb?: string[] }

Implement:
  - White background with bottom border
  - Height: 56px
  - Left: breadcrumb navigation (current page path)
  - Right: greeting with student name from Zustand store
  - Background: var(--color-white)
  - Border: 1px solid var(--color-border)
```

---

### 14. Session Restoration on Page Load

In root layout or a client component loaded early:

```typescript
On component mount (useEffect):
  setLoading(true)
  Call initAuth() from useAuth hook
  This silently calls /api/auth/refresh
  If cookie valid: restore auth state
  If cookie invalid: user stays logged out
  setLoading(false)
```

This ensures students stay logged in after page refresh.

---

### 15. `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=https://your-render-backend-url.onrender.com/api
```

Replace with your actual Render backend URL from step 14.

---

## Expected Output When Done

- Next.js 15 runs on localhost:3000 without errors
- All CSS variables available globally
- Outfit and Inter fonts loading correctly
- Axios instance created with interceptor
- TanStack Query client configured
- Zustand auth store working
- Student and admin layouts render with sidebar
- Route guards redirect unauthenticated users to login
- Session restored on page refresh (via refresh token cookie)
- No TypeScript errors

---

## Verification Steps

1. `npm run dev` starts without errors
2. Visit localhost:3000 — no crash
3. Open browser dev tools → Application → Cookies
   Check that httpOnly cookie is set after login attempt
4. Check Network tab — Authorization header added to requests
5. Refresh page — auth state restored from cookie
6. Visit /dashboard without login → redirected to /login
7. Visit /admin/dashboard as student → redirected to /dashboard
8. CSS variable `--color-navy` visible in browser dev tools

---

## Notes

- Root layout is Server Component — no 'use client'
- QueryClientProvider and session restoration need client wrappers
- Create a ClientProviders component if needed to wrap client-only providers
- Sidebar and Topbar are Client Components (use hooks)
- Route guards are Client Components
- Page files can be Server Components by default
- Add 'use client' only where hooks or browser APIs are used
- Never hardcode colors — always use CSS variables
- Refer to design_reference/ HTML files for exact visual reference

## Next Step

→ Give Claude Code `17-shared-components.md`
