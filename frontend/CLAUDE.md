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

src/config/api-endpoints.ts — All backend API endpoint paths (single source of truth)
src/config/routes.ts — All frontend route paths (single source of truth)
src/lib/api.ts — Axios instance with token refresh interceptor
src/lib/query-client.tsx — TanStack Query client + provider
src/lib/env.ts — Environment variable access
src/store/auth.store.ts — Zustand auth store
src/services/ — API calling functions (one file per domain)
src/hooks/queries/ — TanStack Query hooks wrapping services
src/hooks/useAuth.ts — Auth operations hook (login, logout, initAuth)
src/types/index.ts — Shared TypeScript types
src/app/globals.css — CSS variables + Tailwind theme tokens
src/components/shared/LoadingSpinner.tsx — Reusable loader (spinner + friendly message)
src/components/ui/skeleton.tsx — Reusable skeleton placeholder block

## Architecture Rules — API Calling Pattern

Never call API endpoints directly in components or pages.
Follow this layered pattern:

1. **Endpoints** (`src/config/api-endpoints.ts`)
   Single source of truth for all backend API paths.
   Never hardcode API paths anywhere else.

2. **Services** (`src/services/*.service.ts`)
   Each domain has a service file (auth, students, speaking, etc.).
   Services import endpoints from api-endpoints.ts and call them via the Axios instance.
   Services return typed promises — no TanStack Query here.

3. **Query Hooks** (`src/hooks/queries/*.ts`)
   TanStack Query hooks (useQuery, useMutation) that wrap service functions.
   These are the only place TanStack Query is configured per-query.
   Use the tanstack query server side data fetching so to mak the component server rendered instead of client side.

4. **Components / Pages**
   Import and use query hooks — never import services directly.
   Never call api.get/api.post directly in components.

Example flow:
```
api-endpoints.ts → auth.service.ts → useAuthQueries.ts → LoginPage.tsx
```

## Frontend Routes

Never hardcode route paths. Import from `src/config/routes.ts`.
Use `ROUTES.student.dashboard` instead of `'/dashboard'`.
Use `ROUTES.admin.speaking` instead of `'/admin/speaking'`.

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
- Layout files that only compose client components
- Static layout components
- Components that only display data without interaction
- Service files, config files, type files, utility files

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

## Styling Rules

Use ONLY Tailwind CSS utility classes for all styling.
Never use inline `style={{}}` attributes.
Never write custom CSS outside of globals.css.
Never hardcode hex color values — use Tailwind theme utility classes.

All CSS variables are mapped to Tailwind utilities in globals.css @theme.
Use these class patterns:

| CSS Variable         | Tailwind Class Examples                          |
|---------------------|--------------------------------------------------|
| --brand-primary     | bg-brand-primary, text-brand-primary             |
| --brand-accent      | text-brand-accent                                |
| --action-default    | bg-action-default, text-action-default           |
| --action-hover      | bg-action-hover, text-action-hover               |
| --action-subtle     | bg-action-subtle                                 |
| --bg-page           | bg-bg-page                                       |
| --bg-card           | bg-bg-card                                       |
| --bg-accent         | bg-bg-accent                                     |
| --text-primary      | text-text-primary                                |
| --text-secondary    | text-text-secondary                              |
| --text-muted        | text-text-muted                                  |
| --border-default    | border-border-default                            |
| --feedback-success  | text-feedback-success, bg-feedback-success       |
| --feedback-error    | text-feedback-error, bg-feedback-error           |
| --feedback-warning  | text-feedback-warning, bg-feedback-warning       |
| --module-speaking   | text-module-speaking, border-module-speaking     |
| --module-writing    | text-module-writing, border-module-writing       |
| --module-reading    | text-module-reading, border-module-reading       |
| --module-listening  | text-module-listening, border-module-listening   |

Sidebar-specific utilities are also available:
bg-sidebar-active, text-sidebar-text, border-sidebar-divider, etc.

Shadow utilities: shadow-card, shadow-hover, shadow-modal, shadow-button

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

## CSS Variable Names — Reference

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

## Score Color Logic

score >= 80: var(--feedback-success) → text-feedback-success
score 50-79: var(--feedback-warning) → text-feedback-warning
score < 50: var(--feedback-error) → text-feedback-error

## Answer Highlight States

correct (selected + right): bg-feedback-success-bg border-feedback-success
wrong (selected + wrong): bg-feedback-error-bg border-feedback-error
missed (not selected + right): bg-feedback-warning-bg border-feedback-warning
neutral (not selected + wrong): bg-bg-page border-border-default

## Zustand Auth Store

import { useAuthStore } from '@/store/auth.store'
const { user, accessToken, isAuthenticated, setAuth, clearAuth } = useAuthStore()

## Axios Instance

import api from '@/lib/api'
Always use this in services — never use fetch() or raw axios directly.
Interceptor handles token refresh automatically.

## Design Reference

Always refer to these HTML files for visual design:
design_reference/Landing_Page_Redesign.html
design_reference/Section1_Public_Auth_Pages.html
design_reference/Section2_Student_Portal.html
design_reference/Section3_Admin_Portal.html

## Rules

- Always first priority is Next.js server components. Only use 'use client' when genuinely needed.
- Never use inline style={{}} — always use Tailwind CSS utility classes.
- Never hardcode hex color values — always use Tailwind theme utility classes.
- Never use text-sm, font-bold etc directly — use typography token classes.
- Never hardcode API endpoint paths — import from src/config/api-endpoints.ts.
- Never hardcode frontend route paths — import from src/config/routes.ts.
- Never call API directly in components — use services → query hooks pattern.
- Never use localStorage — use Zustand for state, sessionStorage for mock test only.
- Always use Next.js Link for navigation — never <a> tags.
- Always use next/image for images — never <img> tags.
- For data validation use zod package.
- shadcn/ui components as base — customize with Tailwind theme classes.
- Never use emoji or unicode glyph characters as icons (✓, ✗, →, 🎤 etc.). Always use `lucide-react` icon components.
- Prefer shadcn/ui components over raw HTML elements wherever one exists for the job
  (Button instead of `<button>`, Input/Label instead of `<input>`/`<label>`, Badge instead of a manual pill `<span>`,
  Table instead of a raw `<table>`, Switch instead of a manual toggle, AlertDialog instead of a manual modal, etc.).
  Customize via `className` (tailwind-merge resolves conflicts) — never fork the primitive.
- For loading states use `src/components/shared/LoadingSpinner.tsx` (spinner + optional friendly message,
  built with `lucide-react`'s `Loader2` and Tailwind `animate-spin`, responsive sizing) and
  `src/components/ui/skeleton.tsx` (`Skeleton` — Tailwind `animate-pulse` placeholder block) for content
  placeholders. Never build one-off spinners or pulse divs inline.
