# PTEPath Frontend

## Stack

Next.js 15 + React 19 + TypeScript
Tailwind CSS + shadcn/ui
Zustand (auth state)
TanStack Query + Axios (data fetching)
@dnd-kit/core + @dnd-kit/sortable (drag and drop)

## Entry Point

src/app/layout.tsx

## Key Files

src/lib/api.ts Axios instance with token refresh interceptor
src/lib/query-client.ts TanStack Query client
src/store/auth.store.ts Zustand auth store
src/types/index.ts Shared TypeScript types
src/app/globals.css CSS variables (all theming tokens)

## Server vs Client Components

Default: Server Component (no directive needed)
Add 'use client' ONLY when component uses:

- useState, useEffect, useReducer, or any React hook
- Browser APIs (window, document, navigator, MediaRecorder)
- Event handlers (onClick etc.) in interactive components
- Zustand store (useAuthStore)
- TanStack Query hooks (useQuery, useMutation)
- @dnd-kit drag and drop
- Audio recording or playback

Never add 'use client' to:

- Page shells that only pass data down
- Static layout components
- Components that only display data without interaction

## TanStack Query + Server Components

TanStack Query is the standard data-fetching solution for this project.

Do NOT assume TanStack Query requires Client Components.

Prefer Server Components whenever possible.

Use TanStack Query server-side features (prefetching, dehydration/hydration,
SSR, Server Component integration) when appropriate.

Only add 'use client' because a component genuinely requires client-side
interactivity, browser APIs, Zustand, event handlers, recording, drag-and-drop,
or React client hooks.

The presence of TanStack Query alone is NOT a reason to add 'use client'.

Server Components remain the default architecture.

## CSS Variable Names — Always Use These (Never Hardcode Hex)

--brand-primary #0F1B4C sidebar, navbar, hero backgrounds
--brand-accent #F59E0B logo accent, amber highlights
--action-default #2563EB primary buttons, links, active states
--action-hover #3B82F6 button hover states
--action-subtle #EFF6FF selected backgrounds, info tints
--bg-page #F8FAFF page background
--bg-card #FFFFFF card backgrounds
--bg-accent #FFFBEB warning backgrounds
--text-primary #1E293B headings, important text
--text-secondary #64748B body text, descriptions
--text-muted #94A3B8 placeholder, disabled
--border-default #E2E8F0 borders, dividers
--feedback-success #10B981 correct answers, high scores
--feedback-success-bg #ECFDF5 correct answer backgrounds
--feedback-error #EF4444 wrong answers, low scores
--feedback-error-bg #FEF2F2 wrong answer backgrounds
--feedback-warning #F59E0B missed answers, mid scores
--feedback-warning-bg #FFFBEB missed answer backgrounds
--module-speaking #2563EB speaking module accent
--module-writing #7C3AED writing module accent
--module-reading #059669 reading module accent
--module-listening #DC2626 listening module accent

## Typography Token Classes — Always Use These (Never text-sm etc.)

text-display-xl — page hero titles
text-display-lg — page titles (H1)
text-display-md — section headings (H2)
text-display-sm — card titles (H3)
text-body-lg — large body text
text-body-md — standard body text
text-body-sm — small body text
text-label-lg — large labels
text-label-md — standard labels
text-label-sm — small labels, captions, badges
text-score-xl — large score numbers
text-score-lg — medium score numbers
text-score-md — small score numbers

## Score Color Logic

score >= 80: var(--feedback-success)
score 50-79: var(--feedback-warning)
score < 50: var(--feedback-error)

## Answer Highlight States

correct (selected + right): bg --feedback-success-bg, border --feedback-success
wrong (selected + wrong): bg --feedback-error-bg, border --feedback-error
missed (not selected + right):bg --feedback-warning-bg, border --feedback-warning
neutral (not selected + wrong):bg --bg-page, border --border-default

## TanStack Query Patterns

Fetch data:
useQuery({ queryKey: ['key'], queryFn: () => api.get('/route').then(r => r.data.data) })

Mutations:
useMutation({ mutationFn: (data) => api.post('/route', data), onSuccess: () => {} })

Invalidate after mutation:
queryClient.invalidateQueries({ queryKey: ['key'] })

## Zustand Auth Store

import { useAuthStore } from '@/store/auth.store'
const { user, accessToken, isAuthenticated, setAuth, clearAuth } = useAuthStore()

## Axios Instance

import api from '@/lib/api'
Always use this — never use fetch() or axios directly
Interceptor handles token refresh automatically

## Design Reference

Always refer to these HTML files for visual design:
design_reference/Landing_Page_Redesign.html
design_reference/Section1_Public_Auth_Pages.html
design_reference/Section2_Student_Portal.html
design_reference/Section3_Admin_Portal.html

## Rules

- Never hardcode hex color values — always use CSS variables
- Never use text-sm, font-bold etc directly — use token classes
- Never use localStorage — use Zustand for state, sessionStorage for mock test only
- Always use Next.js Link for navigation — never <a> tags
- Always use next/image for images — never <img> tags
- shadcn/ui components as base — customize with CSS variables
