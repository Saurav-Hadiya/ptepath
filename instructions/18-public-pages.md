# 17 — Public Pages

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/17-public-pages.md and implement exactly what is described."

---

## What to Build
All public-facing pages that do not require authentication:
- Landing page
- Login page
- Forgot password page
- Reset password page
- First login change password page
- 404 page
- 500 error page

---

## Reference Docs
- `design_reference/Landing_Page_Redesign.html` — landing page design
- `design_reference/Section1_Public_Auth_Pages.html` — all auth page designs
- `docs/md/authentication-blueprint.md` — auth flows
- `docs/md/theming.md` — CSS variables and typography tokens

---

## Important — CSS Variable Naming Convention
Use semantic CSS variable names throughout. Never hardcode hex values.
Reference: docs/md/theming.md — CSS Variable Name Reference table.

Key variables for public pages:
- Navbar/hero background:  var(--brand-primary)
- Primary buttons:         var(--action-default)
- Button hover:            var(--action-hover)
- Amber accent (logo):     var(--brand-accent)
- Page background:         var(--bg-page)
- Card background:         var(--bg-card)
- Primary text:            var(--text-primary)
- Secondary text:          var(--text-secondary)
- Border:                  var(--border-default)

---

## Prerequisites
- `15-frontend-foundation.md` complete
- `16-shared-components.md` complete
- Logo, LoadingSpinner components available
- Axios instance and Zustand auth store working
- PublicRoute and ProtectedRoute guards working

---

## Page 1 — Landing Page

**File:** `src/app/(public)/page.tsx`
**Type:** Server Component

Reference: `design_reference/Landing_Page_Redesign.html`
Study this file carefully — implement all sections exactly as designed.

### Sections to implement (top to bottom):

**1. Header / Navbar**
- Fixed sticky navbar
- Background: var(--brand-primary) with blur backdrop
- Left: Logo component (light variant)
- Right: nav links (Modules, How It Works, Mock Tests) + Login button
- Login button: var(--action-default) background
- Height: 68px
- On scroll: background becomes fully opaque

**2. Hero Section**
- Background: gradient from var(--brand-primary) to slightly lighter navy
- Left side:
  - Eyebrow badge (amber, with pulsing dot)
  - H1 heading: "Practice with purpose." + "Score with confidence." in blue gradient
  - Description paragraph
  - Two CTA buttons: "Login to Practice" (primary) + "Explore Modules" (outline white)
  - Trust indicator: module badges + "4 modules · 18+ question types · instant scoring"
- Right side: Score visual card (static — not animated)
  - Overall score display (74 / 90)
  - Module breakdown bars (Speaking, Writing, Reading, Listening)
  - Two mini stat cards below
- SVG wave transition at bottom

**3. Features Strip**
- Background: var(--bg-page) slightly tinted
- Horizontal strip: Speaking 5 types | Writing 2 types | Reading 5 types | Listening 8 types | Mock Tests
- Icon + text per item with dividers between

**4. Modules Section** (id="modules")
- Section label + H2 heading + subtitle
- 2x2 grid of module cards
- Each card: left colored border (module color), icon, name, description, question type tags
- Use ModuleCard component or implement inline
- Hover: lift effect

**5. How It Works** (id="how-it-works")
- Background: var(--bg-page)
- 4 numbered steps in a row with connector line between
- Steps: Receive Login → Set Password → Start Practising → Take Mock Tests
- Step numbers: var(--brand-primary) circles

**6. Mock Test Highlight** (id="mock-test")
- Dark navy background
- Left: eyebrow, heading, description, 5 feature bullet points
- Right: CTA button + 2x2 stats grid (18+ questions, 90 min, 4 modules, unlimited retakes)

**7. Why PTEPath Section**
- Background: var(--bg-page)
- 3x2 grid of benefit cards
- Cards: icon box, title, description
- Hover: lift + shadow

**8. CTA Section**
- Background: var(--bg-page)
- Centered: heading, subtitle, login button
- Note below: "Don't have an account? Contact your instructor."

**9. Footer**
- Background: var(--brand-primary)
- 4 columns: brand + tagline, Platform links, Module links, Account links
- Bottom bar: copyright + Privacy/Terms links

### Notes for landing page:
- All "Login" buttons link to /login
- "Explore Modules" scrolls to #modules
- No dynamic data — fully static Server Component
- Smooth scroll behaviour on html element
- Responsive: works on mobile (sidebar collapses to hamburger or hides)

---

## Page 2 — Login Page

**File:** `src/app/(public)/login/page.tsx`
**Type:** Client Component ('use client')

Reference: `design_reference/Section1_Public_Auth_Pages.html` — Page 2

### Layout:
- Full page: navy gradient background
- Small auth navbar: Logo (light) left, "Secure Login" label right
- Centered card: white, 400px max width, border-radius 16px, shadow-modal
- Card contents:
  - Logo centered at top
  - Tagline: "Sign in to continue practising"

### Form Fields:
- Email input with mail icon
- Password input with lock icon
- "Forgot password?" link (right-aligned, below password)
- Submit button: full width, var(--action-default)
- Bottom note: "Don't have an account? Contact your instructor."

### Error State:
- Red alert box above form when credentials wrong
- Message: "Invalid email or password. Please try again."

### On Submit:
````
1. Validate email + password not empty
2. Show loading state on button
3. Call useAuth().login(email, password)
4. On success:
   If requiresPasswordChange: redirect to /change-password
     (store firstLoginToken in memory — not localStorage)
   If role = 'admin': redirect to /admin/dashboard
   If role = 'student': redirect to /dashboard
5. On error: show error alert box
````

### TanStack Query:
Use useMutation for login call.

---

## Page 3 — Forgot Password Page

**File:** `src/app/(public)/forgot-password/page.tsx`
**Type:** Client Component ('use client')

Reference: `design_reference/Section1_Public_Auth_Pages.html` — Page 3

### Layout:
- Same auth wrapper as login page (navy gradient + small navbar)
- Card: key icon centered at top
- Title: "Forgot your password?"
- Subtitle: "Enter your registered email and we'll send you a reset link."

### Form:
- Email input with mail icon
- Hint text: "Enter the email your instructor registered for you."
- Submit button: full width

### Success State:
After submit (regardless of whether email exists):
- Replace form with success message:
  - Green checkmark icon
  - "Reset link sent!"
  - "If this email is registered, a reset link has been sent. Check your inbox."
  - "Back to Login" link

### On Submit:
````
1. Validate email not empty
2. POST /api/auth/forgot-password via api.ts
3. Always show success message regardless of response
   (prevents email enumeration — same response for existing/non-existing email)
4. On network error: show generic error message
````

---

## Page 4 — Reset Password Page

**File:** `src/app/(public)/reset-password/page.tsx`
**Type:** Client Component ('use client')

Reference: `design_reference/Section1_Public_Auth_Pages.html` — Page 4

### On Page Load:
````
Extract from URL query params:
  token = searchParams.get('token')
  id = searchParams.get('id')
If either missing: show "Invalid reset link" error state
````

### Layout:
- Same auth wrapper
- Lock icon centered at top
- Title: "Set a new password"
- Subtitle: "Choose a strong password for your account."

### Form:
- New password input with lock icon
- Password strength indicator (4 bars):
  - 0 bars: empty
  - 1 bar red: < 6 chars
  - 2 bars amber: 6-8 chars, no number
  - 3 bars green: 8+ chars with number
  - 4 bars green: 8+ chars, number, special character
- Password requirements checklist:
  - At least 8 characters (ticks green when met)
  - Contains a number (ticks green when met)
- Confirm password input
- Submit button

### States:
- Invalid link state: show error message + "Request new link" button
- Expired link state: show "This link has expired" + "Request new link" button
- Success state: show success message + "Go to Login" button

### On Submit:
````
1. Validate newPassword min 8 chars + contains number
2. Validate confirmPassword matches
3. POST /api/auth/reset-password with { userId: id, token, newPassword, confirmPassword }
4. On success: show success state
5. On 400 (expired): show expired state
6. On 400 (invalid): show invalid state
````

---

## Page 5 — First Login Change Password Page

**File:** `src/app/(public)/change-password/page.tsx`
**Type:** Client Component ('use client')

Reference: `design_reference/Section1_Public_Auth_Pages.html` — Page 5

### Important:
This page is only accessible with a firstLoginToken.
If no firstLoginToken in memory: redirect to /login.
Student CANNOT skip this page.

### Layout:
- Same auth wrapper
- Wave/hand emoji icon at top
- Title: "Welcome to PTEPath!"
- Amber warning badge: "⚠ You must set your own password before continuing"
- Blue info alert: "Your account was created by your instructor with a temporary password. Please set a new private password that only you know."

### Form:
- New password input
- Password requirements checklist (same as reset password page)
- Confirm password input
- Submit button: "Set Password & Continue →"
- NO back/skip link — student cannot escape this page

### On Submit:
````
1. Validate newPassword min 8 chars + contains number
2. Validate confirmPassword matches
3. POST /api/auth/change-password
   Header: Authorization: Bearer <firstLoginToken>
4. On success:
   Store new accessToken in Zustand store
   Redirect to /dashboard
5. On error: show error message
````

---

## Page 6 — 404 Page

**File:** `src/app/not-found.tsx`
**Type:** Server Component

Reference: `design_reference/Section1_Public_Auth_Pages.html` — Page 6

### Layout:
- Full page with standard navbar (Logo + Login button)
- Centered content:
  - Blue search icon in circle
  - "404" in large light gray (text-display-xl, color var(--border-default))
  - Title: "Page not found"
  - Description: "The page you are looking for does not exist or has been moved."
  - Two buttons: "← Go Home" (navy) + "Go to Login" (outline)
- Standard footer

---

## Page 7 — 500 Error Page

**File:** `src/app/error.tsx`
**Type:** Client Component ('use client')

Required by Next.js — must have reset prop.

Reference: `design_reference/Section1_Public_Auth_Pages.html` — Page 7

Props: `{ error: Error, reset: () => void }`

### Layout:
- Same as 404 but:
  - Red lightning icon in circle
  - "500" in light red
  - Title: "Something went wrong"
  - Description: "An unexpected error occurred on our end."
  - Two buttons: "↺ Refresh Page" (red, calls reset()) + "← Go Home" (outline)
  - Error reference box: red pale background, shows "ERR_500 · If this keeps happening, contact your instructor."
- Standard footer

---

## Shared Auth Page Wrapper Component

Create `src/components/shared/AuthWrapper.tsx`

```typescript
Server Component

Props: {
  children: React.ReactNode
  navLabel?: string
}

Renders:
  - Full min-h-screen
  - Background: gradient from var(--brand-primary) to slightly lighter
  - Small top navbar:
    Logo (light variant) left
    navLabel text right (muted white)
  - Centered content area (flex, items-center, justify-center)
  - Children rendered inside centered area
```

All auth pages (login, forgot, reset, change-password) use this wrapper.

---

## Shared Auth Card Component

Create `src/components/shared/AuthCard.tsx`

```typescript
Server Component

Props: {
  children: React.ReactNode
  maxWidth?: string  — default '400px'
}

Renders:
  - White card
  - Border radius: var(--radius-modal) — 16px
  - Padding: 40px
  - Box shadow: var(--shadow-modal)
  - Width 100%, maxWidth from props
```

---

## Expected Output When Done
- Landing page renders all 9 sections correctly
- Landing page is fully responsive on mobile
- Login page shows form, handles errors, redirects correctly
- Forgot password shows success message always
- Reset password validates link, shows strength indicator
- Change password page cannot be skipped
- 404 page shows on wrong URL
- 500 page shows on error with reset button
- All pages use semantic CSS variables — no hardcoded colors
- All pages match design_reference HTML files visually

---

## Verification Steps
1. Visit localhost:3000 → landing page renders all sections
2. Visit localhost:3000/login → form renders, error shows on wrong creds
3. Login with admin credentials → redirects to /admin/dashboard
4. Login with student credentials → redirects to /dashboard
5. Login with new student (isFirstLogin=true) → redirects to /change-password
6. Visit /forgot-password → submit any email → success message shows
7. Visit /reset-password (no params) → invalid link state shows
8. Visit /some-wrong-url → 404 page shows
9. Visit /change-password without firstLoginToken → redirect to /login
10. All pages: check no hardcoded colors in browser inspector

---

## Notes
- Landing page is fully static — Server Component, no hooks
- Login, forgot, reset, change-password are Client Components
- Use TanStack Query useMutation for all form submissions
- firstLoginToken stored in Zustand store memory only
  Add firstLoginToken field to auth store if not already present
- PublicRoute wrapper used on login/forgot/reset pages
  (redirects already-logged-in users away)
- Change password page does NOT use PublicRoute
  It is accessible with firstLoginToken only
- Never store firstLoginToken in localStorage
- Smooth scroll enabled via CSS on html element

## Next Step
→ Give Claude Code `19-student-dashboard.md`
