# Authentication & Access Control — Complete Blueprint

## Overview

**Platform:** PTEPath — PTE Exam Practice Platform
**Type:** Closed platform — no public registration
**Approach:** Custom JWT — no third-party auth service
**Cost:** Rs. 0 forever

---

## npm Packages Required

| Package | Purpose | Install |
|---|---|---|
| bcryptjs | Hash and verify passwords | npm install bcryptjs |
| jsonwebtoken | Generate and verify JWT tokens | npm install jsonwebtoken |
| cookie-parser | Parse httpOnly cookies in Express | npm install cookie-parser |
| resend | Send password reset emails (free: 3000/month) | npm install resend |
| express-rate-limit | Rate limit login endpoint | npm install express-rate-limit |

---

## Platform Model

**Closed platform.** No student can register on their own.
Admin creates every student account manually, sets a temporary password, and shares credentials with the student.
Student logs in and is immediately forced to change their password before accessing anything.

| Role | How Created | Access |
|---|---|---|
| Admin | One-time seed script — no UI | Full admin panel |
| Student | Admin creates from admin panel | Student portal only |

---

## Token Strategy — Dual Token System

| Token | Lifetime | Stored In | Purpose |
|---|---|---|---|
| Access Token | 15 minutes | Frontend memory (React state/context) | Sent with every API request in Authorization header |
| Refresh Token | 7 days | httpOnly cookie | Used silently to get new Access Token when it expires |

**Why httpOnly cookie for Refresh Token:**
Cannot be accessed by any JavaScript — not even your own code.
Protects against XSS attacks. Browser sends it automatically but scripts cannot steal it.

---

## Environment Variables Required

```
# .env — never commit to GitHub
ACCESS_TOKEN_SECRET=<random 32+ character string>
REFRESH_TOKEN_SECRET=<different random 32+ character string>
RESEND_API_KEY=<from resend.com dashboard>
FRONTEND_URL=https://yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong password>
ADMIN_NAME=Admin
MONGO_URI=<mongodb atlas connection string>
```

---

## Database Schema — Users Collection (`users`)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| name | String | Full name |
| email | String | Unique. Indexed. Stored lowercase. |
| passwordHash | String | bcrypt hash. Original password never stored. |
| role | String | student \| admin |
| isActive | Boolean | true = can log in. false = disabled. |
| isFirstLogin | Boolean | true = must change password before any access. Set true on create and admin reset. |
| tokenVersion | Integer | Incremented on password change or admin reset. Embedded in Refresh Token for invalidation. |
| resetTokenHash | String | Hashed reset token. Null when not in use. |
| resetTokenExpiry | Date | Expiry time of reset token. Null when not in use. |
| createdAt | Date | Account creation timestamp |
| totalAttempts | Integer | Total practice attempts across all modules |
| totalMockTests | Integer | Total mock test attempts |
| lastActiveAt | Date | Last time student submitted any attempt |

---

## Admin Account — One-Time Setup

No admin registration UI exists. Created once via seed script at initial deployment.

```
Steps:
1. Create scripts/seed-admin.js
2. Read ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME from .env
3. Hash password with bcryptjs (salt round 12)
4. Save to DB: { name, email, passwordHash, role: 'admin', isActive: true, createdAt }
5. Run once: node scripts/seed-admin.js
6. Delete the seed script after running
7. Credentials stay only in .env and database
```

**Admin login redirect logic:**
```
Login response → check role in JWT payload
role: 'admin'                     → redirect to /admin/dashboard
role: 'student'                   → redirect to /dashboard
role: 'student' + isFirstLogin    → redirect to /change-password
```

---

## Admin Creates Student Account

### Flow
1. Navigate: Admin Panel → Students → Add New Student
2. Fill: name (required), email (required, must be unique), temporary password (required)
3. Backend validates: if email exists → error "A student with this email already exists."
4. Hash password with bcryptjs (salt round 12)
5. Save student: `{ name, email, passwordHash, role: 'student', isFirstLogin: true, isActive: true, createdAt, totalAttempts: 0, totalMockTests: 0, lastActiveAt: null }`
6. Admin shares credentials with student manually (WhatsApp, email, etc.)
7. Platform does NOT auto-send credentials

### Student Management Routes (Admin)

| Action | Route | What It Does |
|---|---|---|
| Create student | POST /api/admin/students | Creates account with isFirstLogin: true |
| List all students | GET /api/admin/students | All students with status + last active |
| Get one student | GET /api/admin/students/:id | Details + attempt counts |
| Edit student | PUT /api/admin/students/:id | Update name or email only — not password |
| Reset password | PATCH /api/admin/students/:id/reset-password | New temp password. isFirstLogin → true. tokenVersion +1. |
| Disable account | PATCH /api/admin/students/:id/status | isActive: false |
| Enable account | PATCH /api/admin/students/:id/status | isActive: true |
| Delete student | DELETE /api/admin/students/:id | Permanent deletion |

---

## Student First Login — Forced Password Change

### Flow
1. Student enters email + temporary password on login page
2. Backend validates credentials → checks `isActive` → if false: "Your account has been disabled. Please contact your administrator."
3. If credentials valid + `isFirstLogin: true` → return special `firstLoginToken` (10 minutes lifetime) + flag `{ requiresPasswordChange: true }`
4. Frontend redirects to `/change-password` — student cannot access any other page
5. `firstLoginToken` is only accepted by `POST /api/auth/change-password` — all other routes reject it with 403
6. Student sets new password (min 8 characters, at least one number, confirm must match)
7. Backend: hash new password → `isFirstLogin: false` → invalidate firstLoginToken → issue full Access Token + Refresh Token
8. Student enters dashboard. Cannot reach change-password page again unless admin resets.

---

## Normal Login Flow

1. Student/Admin: `POST /api/auth/login` with `{ email, password }`
2. Backend: find user by email → `bcryptjs.compare(password, passwordHash)` → check `isActive` → check `isFirstLogin`
3. Generate tokens:
   - Access Token: signed with `ACCESS_TOKEN_SECRET`, expires 15min, payload `{ userId, role, tokenVersion }`
   - Refresh Token: signed with `REFRESH_TOKEN_SECRET`, expires 7 days, payload `{ userId, tokenVersion }`
4. Send: Access Token in response body. Refresh Token as httpOnly, SameSite=Strict, Secure cookie.
5. Frontend: store Access Token in React context/memory (never localStorage). Add to every request: `Authorization: Bearer <token>`

---

## Silent Token Refresh Flow

```
API request → server returns 401 (token expired)
        ↓
Frontend calls POST /api/auth/refresh automatically
(Refresh Token sent via cookie by browser)
        ↓
Backend: verify Refresh Token → check tokenVersion matches DB → check isActive
If valid → issue new Access Token
If invalid → 401 → frontend redirects to login
        ↓
Frontend retries original request with new Access Token
        ↓
Student never notices. Seamless experience.

If Refresh Token also expired (7 days):
→ Frontend redirects to login. Student logs in again.
```

---

## Logout Flow

1. Student clicks Logout → `POST /api/auth/logout`
2. Backend: clear Refresh Token cookie (set `maxAge: 0`)
3. Frontend: set Access Token to null, clear React context/state
4. Redirect to login page

---

## Password Reset — Student Self-Service (Forgot Password)

### Full Flow

1. Student clicks "Forgot Password" → enters email
2. Backend: find user by email. **Always return same message regardless of whether email exists:** "If this email is registered, a reset link has been sent." — prevents email enumeration.
3. If email exists:
   - `crypto.randomBytes(32)` → raw token
   - Hash raw token with bcryptjs → store `resetTokenHash` + `resetTokenExpiry` (10 minutes) on user document
   - Send **raw (unhashed)** token in email link via Resend
4. Email link format: `https://yourdomain.com/reset-password?token=<rawToken>&id=<userId>`
5. Student clicks link → frontend extracts token + userId from URL → shows new password form
6. Student submits: `POST /api/auth/reset-password` with `{ userId, token, newPassword, confirmPassword }`
7. Backend validates:
   - Find student by userId
   - Check `resetTokenExpiry` — if expired → "This reset link has expired. Please request a new one."
   - Hash incoming token → compare to `resetTokenHash` → if no match → "Invalid reset link."
8. Password updated: hash new password → clear `resetTokenHash` + `resetTokenExpiry` → no auto-login → fresh login required

### Admin Resets Student Password (From Admin Panel)

1. Admin Panel → Students → select student → Reset Password
2. Admin sets new temporary password
3. Backend: hash password → `isFirstLogin: true` → clear any existing reset tokens → increment `tokenVersion` (kills active sessions)
4. Admin shares new credentials with student
5. Student logs in → forced to change password again

---

## Role-Based Access Control (RBAC)

### Two Middleware Functions

**`authenticate` middleware:**
- Reads `Authorization: Bearer <accessToken>` header
- Verifies token signature using `ACCESS_TOKEN_SECRET`
- Checks token not expired
- Attaches `{ userId, role }` to `req.user`
- If missing/invalid/expired → 401 Unauthorized

**`authorize(requiredRole)` middleware:**
- Reads `req.user.role`
- Compares to `requiredRole` parameter
- If no match → 403 Forbidden
- If match → passes to route handler

### Route Protection Examples

| Route | Middleware | Who Can Access |
|---|---|---|
| POST /api/auth/login | None | Anyone (public) |
| POST /api/auth/refresh | None (cookie) | Anyone with valid refresh cookie |
| POST /api/auth/change-password | authenticate (firstLoginToken) | Student on first login only |
| GET /api/speaking/question/:id | authenticate | Any logged-in user |
| POST /api/speaking/evaluate | authenticate | Any logged-in user |
| GET /api/admin/students | authenticate + authorize('admin') | Admin only |
| POST /api/admin/questions | authenticate + authorize('admin') | Admin only |

### Frontend Route Guards (Next.js)

| Scenario | What Happens |
|---|---|
| Unauthenticated visits /dashboard | Redirect to /login |
| Unauthenticated visits /admin | Redirect to /login |
| Student visits /admin/* | Redirect to /dashboard |
| Student with isFirstLogin visits /dashboard | Redirect to /change-password |
| Logged-in user visits /login | Redirect to /dashboard or /admin/dashboard based on role |

---

## Token Invalidation — tokenVersion Strategy

Instead of a token blocklist (complex), a single integer handles all invalidation.

**When `tokenVersion` is incremented:**
- Admin resets student password
- Student changes their own password

**How it works:**
- `tokenVersion` embedded in both Access Token and Refresh Token payload at issue time
- On every token refresh: compare token's `tokenVersion` to DB value
- If mismatch → token rejected → student must log in again

| Situation | Action |
|---|---|
| Admin resets password | tokenVersion +1 → all active sessions immediately invalidated |
| Admin disables account | isActive checked on every refresh → disabled → refresh rejected |
| Student changes password | tokenVersion +1 → old Refresh Token invalid |
| Student logs out | Refresh Token cookie cleared |

---

## Security Checklist

| Risk | Protection |
|---|---|
| Password in plain text | bcryptjs hash, salt round 12 — never stored |
| Weak JWT secret | 32+ character random string in .env |
| XSS token theft | Refresh Token in httpOnly cookie. Access Token in memory only. |
| CSRF via cookie | SameSite=Strict on Refresh Token cookie |
| Brute force login | Rate limiter: 5 attempts / IP / 15 minutes → 429 response |
| Email enumeration | Always return same message on forgot password |
| Reset token interception | Token hashed in DB. Raw token only in email. Expires in 10 minutes. |
| Expired reset link reuse | resetTokenExpiry checked before reset. Cleared after first use. |
| Admin account via UI | No admin register endpoint. Seed script only. |
| Student bypassing first login | firstLoginToken only valid on /change-password. All other routes → 403. |
| Secrets in source code | All in .env. .env in .gitignore. Never committed. |
| Non-HTTPS in production | Secure flag on cookie — only sent over HTTPS |

### Rate Limiting Config — Login Endpoint Only
```
Window:   15 minutes
Max:      5 requests per IP per window
Response: 429 Too Many Requests
Message:  "Too many login attempts. Please try again in 15 minutes."
```

---

## All Authentication API Routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/login | Public | Login for admin and student |
| POST | /api/auth/refresh | Cookie | Get new Access Token using Refresh Token |
| POST | /api/auth/logout | Authenticated | Clear Refresh Token cookie |
| GET | /api/auth/me | Authenticated | Get current logged-in user info |
| POST | /api/auth/change-password | firstLoginToken | Forced password change on first login |
| POST | /api/auth/forgot-password | Public | Request password reset email |
| POST | /api/auth/reset-password | Public | Submit new password using reset token |
| POST | /api/auth/update-password | Authenticated | Student changes own password voluntarily |
| POST | /api/admin/students | Admin | Create new student account |
| GET | /api/admin/students | Admin | List all students |
| GET | /api/admin/students/:id | Admin | Get one student details |
| PUT | /api/admin/students/:id | Admin | Edit student name or email |
| PATCH | /api/admin/students/:id/reset-password | Admin | Admin resets student password |
| PATCH | /api/admin/students/:id/status | Admin | Enable or disable student account |
| DELETE | /api/admin/students/:id | Admin | Delete student account permanently |

---

## Edge Cases — All Handled

| Scenario | How Handled |
|---|---|
| Student tries to register via URL | No register route. 404 returned. |
| Wrong password | Return "Invalid email or password" — never specify which is wrong |
| Account disabled mid-session | Next token refresh fails → redirect to login with "Account disabled." |
| Admin resets password while student logged in | tokenVersion +1 → next API call fails 401 → redirect to login |
| Expired reset link | resetTokenExpiry checked → "This link has expired. Please request a new one." |
| Multiple reset emails requested | Each overwrites previous token in DB. Only latest link works. |
| Reset link clicked twice | resetTokenHash cleared after first use → "Invalid or already used reset link." |
| firstLoginToken used on wrong route | Returns 403. Only /change-password accepts it. |
| Admin deletes own account | Backend checks userId === admin's own ID → reject with "Cannot delete your own account." |
| Duplicate email on student create | Uniqueness check before creation → "A student with this email already exists." |
| Refresh Token tampered | JWT signature verification fails → 401 |
| Access Token used after logout | Lives in memory only — gone on logout. No server blocklist needed for 15-min tokens. |
| Page refresh loses Access Token | On page load frontend calls /api/auth/refresh silently before rendering protected pages |

---

## Key Rules — Must Follow While Building

- No public registration route. If `/register` is visited → 404.
- Admin account created via seed script only — no UI for admin creation.
- isFirstLogin is always set to true when admin creates or resets a student.
- firstLoginToken is a separate short-lived JWT — only valid on one endpoint.
- Access Token stored in React memory/context only — never localStorage or sessionStorage.
- Refresh Token always set as httpOnly + SameSite=Strict + Secure (production).
- tokenVersion embedded in Refresh Token payload — checked on every refresh call.
- Rate limiter applied to /api/auth/login only.
- Forgot password always returns same message — never reveal if email exists.
- Reset token stored as hash in DB — raw token only in email link.
- Reset token expires in 10 minutes — cleared from DB after use.
- bcryptjs salt round: 12.
- JWT secrets: minimum 32 characters, stored in .env only.
