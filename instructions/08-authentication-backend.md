# 07 — Authentication Backend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/07-authentication-backend.md and implement exactly what is described."

---

## What to Build
Complete authentication system for the backend.
This covers login, token management, password reset, and first login flow.

---

## Reference Docs
- `docs/md/authentication-blueprint.md` — complete auth logic, flows, and decisions
- `instructions/06-project-structure.md` — file locations

---

## Prerequisites
- `06-project-structure.md` must be complete
- MongoDB connected and running
- All packages installed

---

## Files to Implement

### 1. `src/models/user.model.ts`

Create Mongoose schema with these exact fields:

| Field | Type | Details |
|---|---|---|
| name | String | required, trim |
| email | String | required, unique, lowercase, trim, indexed |
| passwordHash | String | required |
| role | String | enum: ['student', 'admin'], default: 'student' |
| isActive | Boolean | default: true |
| isFirstLogin | Boolean | default: true |
| tokenVersion | Number | default: 0 |
| resetTokenHash | String | default: null |
| resetTokenExpiry | Date | default: null |
| createdAt | Date | default: Date.now |
| totalAttempts | Number | default: 0 |
| totalMockTests | Number | default: 0 |
| lastActiveAt | Date | default: null |

Export as `User` model.

---

### 2. `src/utils/jwt.utils.ts`

Implement these functions:

**`generateAccessToken(userId, role, tokenVersion)`**
- Signs JWT with ACCESS_TOKEN_SECRET
- Payload: `{ userId, role, tokenVersion }`
- Expires: 15 minutes

**`generateRefreshToken(userId, tokenVersion)`**
- Signs JWT with REFRESH_TOKEN_SECRET
- Payload: `{ userId, tokenVersion }`
- Expires: 7 days

**`generateFirstLoginToken(userId)`**
- Signs JWT with ACCESS_TOKEN_SECRET
- Payload: `{ userId, isFirstLogin: true }`
- Expires: 10 minutes

**`verifyAccessToken(token)`**
- Verifies with ACCESS_TOKEN_SECRET
- Returns decoded payload or throws error

**`verifyRefreshToken(token)`**
- Verifies with REFRESH_TOKEN_SECRET
- Returns decoded payload or throws error

---

### 3. `src/utils/hash.utils.ts`

**`hashPassword(password)`**
- bcryptjs hash with salt round 12
- Returns hashed string

**`comparePassword(password, hash)`**
- bcryptjs compare
- Returns boolean

---

### 4. `src/utils/token.utils.ts`

**`generateResetToken()`**
- crypto.randomBytes(32).toString('hex')
- Returns raw token string

**`hashResetToken(token)`**
- bcryptjs hash with salt round 10
- Returns hashed token for DB storage

**`compareResetToken(rawToken, hashedToken)`**
- bcryptjs compare
- Returns boolean

---

### 5. `src/middleware/authenticate.ts`

Middleware function `authenticate`:
- Read Authorization header: `Bearer <token>`
- If missing → 401 `{ success: false, message: 'Access token required' }`
- Verify token using `verifyAccessToken()`
- If expired or invalid → 401 `{ success: false, message: 'Invalid or expired token' }`
- If token has `isFirstLogin: true` → 403 `{ success: false, message: 'Password change required' }`
- Attach `{ userId, role }` to `req.user`
- Call `next()`

---

### 6. `src/middleware/authenticate.ts` — `authenticateFirstLogin`

Separate middleware for the change-password route only:
- Read Authorization header: `Bearer <token>`
- Verify token
- Token MUST have `isFirstLogin: true` in payload
- If not → 403 `{ success: false, message: 'Forbidden' }`
- Attach `userId` to `req.user`
- Call `next()`

---

### 7. `src/middleware/authorize.ts`

Middleware factory `authorize(requiredRole)`:
- Reads `req.user.role`
- If role does not match requiredRole → 403 `{ success: false, message: 'Forbidden — insufficient permissions' }`
- If matches → call `next()`

---

### 8. `src/controllers/auth.controller.ts`

Implement these controller functions:

---

**`login`** — POST /api/auth/login
````
1. Get email + password from req.body
2. Validate: both required
3. Find user by email (case insensitive)
4. If not found → 401 'Invalid email or password'
   (never say which one is wrong)
5. Check isActive → if false → 403 'Your account has been disabled.
   Please contact your administrator.'
6. Compare password with passwordHash using comparePassword()
7. If no match → 401 'Invalid email or password'
8. If isFirstLogin: true →
   Generate firstLoginToken
   Return 200 { requiresPasswordChange: true, firstLoginToken }
9. Generate accessToken + refreshToken (include tokenVersion)
10. Set refreshToken as httpOnly cookie:
    - httpOnly: true
    - secure: true (production) / false (development)
    - sameSite: 'strict'
    - maxAge: 7 days in milliseconds
11. Return 200 { accessToken, user: { id, name, email, role } }
````

---

**`refresh`** — POST /api/auth/refresh
````
1. Read refreshToken from req.cookies
2. If missing → 401 'Refresh token required'
3. Verify refreshToken using verifyRefreshToken()
4. If invalid → 401 'Invalid refresh token'
5. Find user by userId from token payload
6. If not found → 401 'User not found'
7. Check isActive → if false → 403 'Account disabled'
8. Compare tokenVersion in token payload with user.tokenVersion in DB
9. If mismatch → 401 'Token invalidated. Please log in again.'
10. Generate new accessToken
11. Return 200 { accessToken }
````

---

**`logout`** — POST /api/auth/logout
````
1. Clear refreshToken cookie (set maxAge: 0)
2. Return 200 { success: true, message: 'Logged out successfully' }
````

---

**`getMe`** — GET /api/auth/me
````
1. req.user has userId from authenticate middleware
2. Find user by id
3. Return 200 { user: { id, name, email, role } }
````

---

**`changePasswordFirstLogin`** — POST /api/auth/change-password
````
Uses authenticateFirstLogin middleware (firstLoginToken only)

1. Get newPassword + confirmPassword from req.body
2. Validate:
   - Both required
   - newPassword minimum 8 characters
   - At least one number in newPassword
   - newPassword === confirmPassword
3. Hash newPassword using hashPassword()
4. Update user:
   - passwordHash = new hash
   - isFirstLogin = false
   - tokenVersion + 1 (invalidate firstLoginToken)
5. Generate full accessToken + refreshToken
6. Set refreshToken cookie
7. Return 200 { accessToken, user: { id, name, email, role } }
````

---

**`forgotPassword`** — POST /api/auth/forgot-password
````
1. Get email from req.body
2. Always return same response regardless of whether email exists:
   200 { success: true, message: 'If this email is registered, a reset link has been sent.' }
   (prevents email enumeration attacks)
3. Find user by email
4. If not found → return same success response (do not reveal)
5. Generate reset token using generateResetToken()
6. Hash it using hashResetToken()
7. Save to user: resetTokenHash + resetTokenExpiry (now + 10 minutes)
8. Build reset link: FRONTEND_URL + /reset-password?token=<rawToken>&id=<userId>
9. Send email via email.service.ts with reset link
10. Return same success response
````

---

**`resetPassword`** — POST /api/auth/reset-password
````
1. Get userId + token + newPassword + confirmPassword from req.body
2. Validate all required
3. Find user by userId
4. If not found → 400 'Invalid reset link'
5. Check resetTokenExpiry → if expired →
   400 'This reset link has expired. Please request a new one.'
6. Compare raw token with stored resetTokenHash using compareResetToken()
7. If no match → 400 'Invalid or already used reset link'
8. Validate newPassword (min 8 chars, at least one number)
9. Validate confirmPassword matches
10. Hash new password
11. Update user:
    - passwordHash = new hash
    - resetTokenHash = null
    - resetTokenExpiry = null
    - tokenVersion + 1
12. Return 200 { success: true, message: 'Password reset successful. Please log in.' }
    (no auto-login after reset)
````

---

**`updatePassword`** — POST /api/auth/update-password
````
Uses authenticate middleware (normal logged-in user)

1. Get currentPassword + newPassword + confirmPassword from req.body
2. Find user by req.user.userId
3. Compare currentPassword with passwordHash
4. If no match → 400 'Current password is incorrect'
5. Validate newPassword (min 8 chars, one number)
6. Validate confirmPassword matches
7. Hash newPassword
8. Update user:
   - passwordHash = new hash
   - tokenVersion + 1
9. Clear refreshToken cookie (force re-login)
10. Return 200 { success: true, message: 'Password updated. Please log in again.' }
````

---

### 9. `src/services/email.service.ts`

**`sendPasswordResetEmail(toEmail, resetLink)`**
- Use Resend SDK
- From: RESEND_FROM_EMAIL env variable
- To: toEmail
- Subject: 'Reset your PTEPath password'
- HTML body: clear email with reset link button
  - Include: "This link expires in 10 minutes."
  - Include: "If you did not request this, ignore this email."
- Return success or throw error

---

### 10. `src/routes/auth.routes.ts`

````
POST   /api/auth/login                 → login
POST   /api/auth/refresh               → refresh
POST   /api/auth/logout                → logout
GET    /api/auth/me                    → authenticate, getMe
POST   /api/auth/change-password       → authenticateFirstLogin, changePasswordFirstLogin
POST   /api/auth/forgot-password       → forgotPassword
POST   /api/auth/reset-password        → resetPassword
POST   /api/auth/update-password       → authenticate, updatePassword
````

Apply rate limiter to login route only:
- Window: 15 minutes
- Max: 5 requests per IP
- Message: 'Too many login attempts. Please try again in 15 minutes.'

---

### 11. `scripts/seed-admin.ts`

Script to create admin account. Run once during deployment.

````
1. Connect to MongoDB using MONGO_URI from .env
2. Check if admin already exists (find by ADMIN_EMAIL)
3. If exists → log 'Admin already exists. Skipping.' → exit
4. Hash ADMIN_PASSWORD using hashPassword()
5. Create user document:
   {
     name: ADMIN_NAME,
     email: ADMIN_EMAIL,
     passwordHash: hashedPassword,
     role: 'admin',
     isActive: true,
     isFirstLogin: false,
     tokenVersion: 0
   }
6. Save to DB
7. Log 'Admin account created successfully.'
8. Disconnect and exit
````

---

## Cookie Configuration

| Setting | Development | Production |
|---|---|---|
| httpOnly | true | true |
| secure | false | true |
| sameSite | 'strict' | 'strict' |
| maxAge | 7 days ms | 7 days ms |

Detect environment using `NODE_ENV` env variable.

---

## Error Response Format — Consistent Across All Routes

```json
{
  "success": false,
  "message": "Error message here"
}
```

Success response format:
```json
{
  "success": true,
  "data": {}
}
```

---

## Expected Output When Done
- All auth routes working
- Login returns accessToken + sets httpOnly cookie
- Refresh endpoint issues new accessToken using cookie
- Logout clears cookie
- First login flow redirects to change-password
- Forgot password sends email via Resend
- Reset password updates password and clears token
- Seed script creates admin when run with `npm run seed`

---

## Verification Steps
1. POST /api/auth/login with valid admin credentials → returns accessToken
2. POST /api/auth/refresh with cookie → returns new accessToken
3. POST /api/auth/logout → clears cookie
4. POST /api/auth/forgot-password with any email → always returns success message
5. Run `npm run seed` → admin account created in MongoDB Atlas

---

## Notes
- Never store plain text password anywhere
- Never reveal which field (email or password) is wrong on login
- Always return same response on forgot-password regardless of email existence
- tokenVersion must be incremented whenever password changes
- firstLoginToken must only work on /api/auth/change-password — all other routes reject it
- Rate limiter on login only — not on other auth routes

## Next Step
→ Give Claude Code `09-student-management-backend.md`
