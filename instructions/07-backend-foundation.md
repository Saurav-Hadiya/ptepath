# 07 — Backend Foundation - DOne

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/07-backend-foundation.md and implement exactly what is described."

---

## What to Build
The working Express server foundation.
This makes the backend actually run — middleware, database connection,
error handling, and server start.
No auth or business logic yet — just the server working correctly.

---

## Reference Docs
- `instructions/06-project-structure.md` — folder structure already created
- `docs/md/authentication-blueprint.md` — environment variable names

---

## Prerequisites
- `06-project-structure.md` complete
- All packages installed (npm install done)
- `backend/.env` file has all credentials filled in
- MongoDB Atlas cluster running

---

## Files to Implement

### 1. `src/config/db.ts`

MongoDB connection function.

```typescript
import mongoose from 'mongoose'

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export default connectDB
```

---

### 2. `src/config/cloudinary.ts`

Cloudinary configuration.

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary
```

---

### 3. `src/middleware/errorHandler.ts`

Global error handler middleware.
Catches all errors passed via next(error).

```typescript
Implement Express error handler with 4 parameters:
  (err, req, res, next)

Behaviour:
  Log error to console in development
  If err.statusCode exists: use it
  Otherwise: default to 500

Response format:
  {
    success: false,
    message: err.message || 'Internal server error'
    stack: only include in development (NODE_ENV !== 'production')
  }
```

---

### 4. `src/middleware/upload.ts`

Multer configuration for file uploads.

Two separate multer instances:

**uploadAudio** — for listening question audio files:
````
Storage: Cloudinary via multer-storage-cloudinary
Folder:  ptepath/listening/audio
Resource type: video  (Cloudinary uses 'video' for audio files)
Allowed formats: mp3, wav, m4a, webm, mp4
Max file size: 5MB
Field name: audio
````

**uploadImage** — for speaking describe-image questions:
````
Storage: Cloudinary via multer-storage-cloudinary
Folder:  ptepath/speaking/images
Resource type: image
Allowed formats: jpg, jpeg, png
Max file size: 5MB
Field name: image
````

**uploadAudioTemp** — for speaking evaluate routes:
````
Storage: disk storage (not Cloudinary)
Destination: tmp/ folder in backend root
File naming: Date.now() + original extension
Purpose: temp storage — file deleted after Groq transcription
Max file size: 10MB (speaking recordings can be up to 40 sec)
Field name: audio
````

Export all three: uploadAudio, uploadImage, uploadAudioTemp

---

### 5. `src/types/index.ts`

Shared TypeScript types used across backend.

```typescript
Define these types and interfaces:

AuthRequest:
  Extends Express Request
  Adds: user?: { userId: string, role: string, tokenVersion?: number }

JwtPayload:
  userId: string
  role: string
  tokenVersion: number
  isFirstLogin?: boolean
  iat?: number
  exp?: number

UserRole:
  Type: 'student' | 'admin'

ScoreResult:
  finalScore: number
  displayScore: string
  feedback: string

SpeakingQuestionType:
  Type: 'read_aloud' | 'repeat_sentence' | 'describe_image'
        | 'respond_situation' | 'answer_short'

WritingQuestionType:
  Type: 'summarise_written_text' | 'write_essay'

ReadingQuestionType:
  Type: 'rw_fill_blanks' | 'mcq_multiple' | 'reorder_paragraphs'
        | 'reading_fill_blanks' | 'mcq_single'

ListeningQuestionType:
  Type: 'summarise_spoken' | 'mcq_multiple' | 'fill_blanks'
        | 'highlight_summary' | 'mcq_single' | 'select_missing'
        | 'highlight_incorrect' | 'write_dictation'
```

---

### 6. `src/app.ts`

Main Express application file.
This is the entry point that ties everything together.

```typescript
Implement in this exact order:

1. Load dotenv at the very top:
   import dotenv from 'dotenv'
   dotenv.config()

2. Import all dependencies:
   express, cors, cookieParser, express-rate-limit
   connectDB from config/db
   errorHandler from middleware/errorHandler
   All route files (import all — even if empty placeholders)

3. Create Express app

4. Connect to MongoDB:
   Call connectDB() before anything else

5. Apply middleware in this order:
   a. CORS:
      origins: [process.env.FRONTEND_URL, 'http://localhost:3000']
      credentials: true
      methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
      allowedHeaders: Content-Type, Authorization

   b. express.json() with limit: '10mb'
      (large enough for writing responses)

   c. express.urlencoded({ extended: true, limit: '10mb' })

   d. cookie-parser

6. Health check route (no auth required):
   GET /api/health
   Returns: { status: 'ok', timestamp: new Date().toISOString() }

7. Register all routes:
   app.use('/api/auth', authRoutes)
   app.use('/api/admin', studentRoutes)
   app.use('/api/admin/speaking', speakingAdminRoutes)
   app.use('/api/admin/writing', writingAdminRoutes)
   app.use('/api/admin/reading', readingAdminRoutes)
   app.use('/api/admin/listening', listeningAdminRoutes)
   app.use('/api/admin/mock-tests', mocktestAdminRoutes)
   app.use('/api/speaking', speakingStudentRoutes)
   app.use('/api/writing', writingStudentRoutes)
   app.use('/api/reading', readingStudentRoutes)
   app.use('/api/listening', listeningStudentRoutes)
   app.use('/api/mock-tests', mocktestStudentRoutes)
   app.use('/api/student', studentDashboardRoutes)

8. 404 handler for unknown routes:
   Returns: { success: false, message: 'Route not found' }

9. Global error handler (must be last middleware):
   app.use(errorHandler)

10. Start server:
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV}`)
    })

11. Export app for testing purposes
```

---

### 7. Route Files — Placeholder Setup

All route files already created in `06-project-structure.md`.
They need basic Express Router setup so app.ts imports work.

For each route file that does not have content yet:
```typescript
import { Router } from 'express'

const router = Router()

// Routes will be added in subsequent steps

export default router
```

Files needing this placeholder:
  src/routes/auth.routes.ts
  src/routes/student.routes.ts
  src/routes/speaking.routes.ts
  src/routes/writing.routes.ts
  src/routes/reading.routes.ts
  src/routes/listening.routes.ts
  src/routes/mocktest.routes.ts

---

### 8. Controller Files — Placeholder Setup

For each controller file:
```typescript
import { Request, Response, NextFunction } from 'express'

// Controller functions will be added in subsequent steps
```

Files needing this:
  src/controllers/auth.controller.ts
  src/controllers/student.controller.ts
  src/controllers/speaking.controller.ts
  src/controllers/writing.controller.ts
  src/controllers/reading.controller.ts
  src/controllers/listening.controller.ts
  src/controllers/mocktest.controller.ts

---

### 9. `tmp/.gitkeep`

Create empty file at `backend/tmp/.gitkeep`
This ensures the tmp folder exists in the repository.
Audio files uploaded here temporarily during speaking evaluate.
Add `tmp/*.webm`, `tmp/*.mp4`, `tmp/*.mp3` to `.gitignore`
but keep `tmp/.gitkeep` tracked.

---

### 10. `backend/.gitignore`

Ensure these are in backend .gitignore:
````
node_modules/
dist/
.env
tmp/*.webm
tmp/*.mp4
tmp/*.mp3
tmp/*.wav
tmp/*.m4a
*.tsbuildinfo
````

---

## Environment Variables Used in This File

````
MONGO_URI              — MongoDB Atlas connection string
CLOUDINARY_CLOUD_NAME  — Cloudinary cloud name
CLOUDINARY_API_KEY     — Cloudinary API key
CLOUDINARY_API_SECRET  — Cloudinary API secret
FRONTEND_URL           — Frontend URL for CORS
PORT                   — Server port (5000 local, 10000 on Render)
NODE_ENV               — development or production
````

All must be in `backend/.env` before running.

---

## Expected Output When Done

````
Running npm run dev:
  nodemon starts
  TypeScript compiles
  MongoDB connected: cluster0.xxxxx.mongodb.net
  Server running on port 5000
  Environment: development
  No errors
````

Test health check:
````
GET http://localhost:5000/api/health
Response: { "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
````

Test 404:
````
GET http://localhost:5000/api/anything-random
Response: { "success": false, "message": "Route not found" }
````

---

## Verification Steps
1. `npm run dev` starts without errors
2. Console shows "MongoDB Connected" message
3. Console shows "Server running on port 5000"
4. GET /api/health returns 200 with ok status
5. GET /api/unknown-route returns 404 with message
6. No TypeScript compilation errors
7. nodemon restarts automatically when a file is changed

---

## Notes
- dotenv.config() must be called before any process.env usage
- CORS must include credentials: true (needed for httpOnly cookies)
- CORS origins must be array — not single string
- uploadAudioTemp uses disk storage — NOT Cloudinary
  (speaking eval audio is temporary — never permanently stored)
- uploadAudio uses Cloudinary — for listening module questions
- uploadImage uses Cloudinary — for speaking describe-image questions
- Error handler must be registered AFTER all routes
- 404 handler must be BEFORE error handler but AFTER all routes
- tmp folder must exist — .gitkeep ensures this
- All route files need at minimum a Router export to avoid import errors

## Next Step
→ Give Claude Code `08-authentication-backend.md`
