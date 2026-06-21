# 09 — Student Management Backend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/09-student-management-backend.md and implement exactly what is described."

---

## What to Build
Complete student management system for the admin.
Admin creates, edits, disables, resets, and deletes student accounts.
No public registration exists — admin manages all student accounts.

---

## Reference Docs
- `docs/md/authentication-blueprint.md` — student management routes and flows
- `instructions/07-authentication-backend.md` — user model and utility functions

---

## Prerequisites
- `07-authentication-backend.md` must be complete
- User model exists in `src/models/user.model.ts`
- authenticate and authorize middleware working
- hashPassword utility working

---

## Files to Implement

### 1. `src/controllers/student.controller.ts`

Implement these controller functions:

---

**`createStudent`** — POST /api/admin/students
````
1. Get name + email + temporaryPassword from req.body
2. Validate:
   - name: required, non-empty string
   - email: required, valid email format
   - temporaryPassword: required, minimum 6 characters
3. Check if email already exists in DB (case insensitive)
4. If exists → 400 'A student with this email already exists.'
5. Hash temporaryPassword using hashPassword()
6. Create user document:
   {
     name: name.trim(),
     email: email.toLowerCase().trim(),
     passwordHash: hashedPassword,
     role: 'student',
     isActive: true,
     isFirstLogin: true,
     tokenVersion: 0,
     totalAttempts: 0,
     totalMockTests: 0,
     lastActiveAt: null
   }
7. Save to DB
8. Return 201 {
     success: true,
     message: 'Student account created successfully.',
     data: { id, name, email, isFirstLogin, isActive, createdAt }
   }
   (never return passwordHash in response)
````

---

**`getAllStudents`** — GET /api/admin/students
````
1. Fetch all users where role = 'student'
2. Sort by createdAt descending (newest first)
3. Return only safe fields:
   id, name, email, isActive, isFirstLogin,
   totalAttempts, totalMockTests, lastActiveAt, createdAt
4. Never return passwordHash, tokenVersion,
   resetTokenHash, resetTokenExpiry
5. Return 200 {
     success: true,
     data: { students: [...], total: number }
   }
````

---

**`getOneStudent`** — GET /api/admin/students/:id
````
1. Find user by id where role = 'student'
2. If not found → 404 'Student not found'
3. Return safe fields only (same as getAllStudents)
4. Return 200 { success: true, data: { student } }
````

---

**`updateStudent`** — PUT /api/admin/students/:id
````
1. Get name + email from req.body
   (only name and email can be updated — not password, not role)
2. Validate:
   - At least one field provided
   - If email provided: valid email format
3. Find student by id where role = 'student'
4. If not found → 404 'Student not found'
5. If email changed: check new email not already used by another user
6. If duplicate email → 400 'A student with this email already exists.'
7. Update only provided fields
8. Save to DB
9. Return 200 {
     success: true,
     message: 'Student updated successfully.',
     data: { student: safe fields }
   }
````

---

**`resetStudentPassword`** — PATCH /api/admin/students/:id/reset-password
````
1. Get newTemporaryPassword from req.body
2. Validate: required, minimum 6 characters
3. Find student by id where role = 'student'
4. If not found → 404 'Student not found'
5. Hash newTemporaryPassword using hashPassword()
6. Update user:
   - passwordHash = new hash
   - isFirstLogin = true (force password change on next login)
   - tokenVersion + 1 (invalidate all active sessions)
   - resetTokenHash = null (clear any pending reset tokens)
   - resetTokenExpiry = null
7. Save to DB
8. Return 200 {
     success: true,
     message: 'Password reset successfully. Student must change password on next login.'
   }
````

---

**`toggleStudentStatus`** — PATCH /api/admin/students/:id/status
````
1. Get isActive (boolean) from req.body
2. Validate: isActive must be boolean (true or false)
3. Find student by id where role = 'student'
4. If not found → 404 'Student not found'
5. Prevent admin from disabling themselves:
   If req.user.userId === student.id → 400 'Cannot change your own account status.'
6. Update user: isActive = isActive
7. Save to DB
8. Return 200 {
     success: true,
     message: isActive ? 'Student account enabled.' : 'Student account disabled.'
   }
````

---

**`deleteStudent`** — DELETE /api/admin/students/:id
````
1. Find student by id where role = 'student'
2. If not found → 404 'Student not found'
3. Prevent admin from deleting themselves:
   If req.user.userId === student.id → 400 'Cannot delete your own account.'
4. Delete user document from DB
5. Return 200 {
     success: true,
     message: 'Student account deleted permanently.'
   }
````

---

### 2. `src/routes/student.routes.ts`

All routes require authenticate + authorize('admin') middleware:

````
POST   /api/admin/students                        → createStudent
GET    /api/admin/students                        → getAllStudents
GET    /api/admin/students/:id                    → getOneStudent
PUT    /api/admin/students/:id                    → updateStudent
PATCH  /api/admin/students/:id/reset-password     → resetStudentPassword
PATCH  /api/admin/students/:id/status             → toggleStudentStatus
DELETE /api/admin/students/:id                    → deleteStudent
````

---

## Response Format — Consistent

### Success
```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Safe Student Response Object

Always return this shape for student data — never include sensitive fields:

```typescript
{
  id: string
  name: string
  email: string
  isActive: boolean
  isFirstLogin: boolean
  totalAttempts: number
  totalMockTests: number
  lastActiveAt: Date | null
  createdAt: Date
}
```

Fields to NEVER return in any response:
- passwordHash
- tokenVersion
- resetTokenHash
- resetTokenExpiry

---

## Input Validation Rules

| Field | Rule |
|---|---|
| name | Required. String. Non-empty after trim. Max 100 characters. |
| email | Required. Valid email format. Stored lowercase. |
| temporaryPassword | Required. Min 6 characters. |
| newTemporaryPassword | Required. Min 6 characters. |
| isActive | Required. Must be boolean true or false. |

---

## Important Security Rules
- All routes protected by authenticate + authorize('admin')
- Admin cannot disable their own account
- Admin cannot delete their own account
- Only name and email can be updated — password updates go through reset-password route
- Role cannot be changed via API — always set at creation
- Password never returned in any response

---

## Expected Output When Done
- Admin can create student accounts
- Admin can list all students
- Admin can view one student
- Admin can edit student name/email
- Admin can reset student password (sets isFirstLogin back to true)
- Admin can enable/disable student accounts
- Admin can delete student accounts
- All routes protected — non-admin gets 403

---

## Verification Steps
1. POST /api/admin/students → creates student (requires admin token)
2. GET /api/admin/students → returns list of all students
3. PATCH /api/admin/students/:id/reset-password → resets password, isFirstLogin becomes true
4. PATCH /api/admin/students/:id/status with `{ isActive: false }` → disables account
5. Disabled student tries to login → gets 403 'Account disabled' message
6. GET /api/admin/students (no token) → returns 401
7. GET /api/admin/students (student token) → returns 403

---

## Notes
- Student accounts always start with isFirstLogin: true
- When admin resets password: tokenVersion increments — student is forced to log in again
- Disabling an account does not delete it — data is preserved
- Deleting is permanent — no soft delete needed for this platform
- Email stored as lowercase always — compare case insensitive on creation/update

## Next Step
→ Give Claude Code `10-speaking-backend.md`
