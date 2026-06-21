# PTEPath Backend

## Stack
Node.js + Express + TypeScript
MongoDB Atlas + Mongoose
ts-node + nodemon for development

## Entry Point
src/app.ts

## Folder Structure
src/
├── config/       db.ts, cloudinary.ts
├── controllers/  one file per module
├── middleware/   authenticate.ts, authorize.ts, errorHandler.ts, upload.ts
├── models/       one model per collection
├── routes/       one routes file per module
├── scoring/      one scoring file per module
├── services/     stt.adapter.ts, email.service.ts, cloudinary.service.ts
├── types/        index.ts (shared TypeScript types)
└── utils/        jwt.utils.ts, hash.utils.ts, token.utils.ts

## Environment Variables
MONGO_URI, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
GROQ_API_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL
FRONTEND_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
PORT=5000 (local), NODE_ENV=development

## API Response Format — Always Use This
Success:
{
  success: true,
  message: "optional",
  data: {}
}

Error:
{
  success: false,
  message: "error description"
}

## Auth Rules
- Access Token: 15 min, memory only, payload: { userId, role, tokenVersion }
- Refresh Token: 7 days, httpOnly cookie, SameSite=Strict
- authenticate middleware: verifies access token, attaches req.user
- authorize(role) middleware: checks req.user.role
- All admin routes: authenticate + authorize('admin')
- All student routes: authenticate only

## Database Rules
- Never store student response text or audio
- On every submission update ONLY:
  question.attemptCount + 1
  question.avgScore (rolling average)
  student.totalAttempts + 1
  student.lastActiveAt = now
- Rolling average: ((currentAvg × currentCount) + newScore) / (currentCount + 1)

## Scoring Rules
- All scores calculated as percentage 0-100 first
- displayScore = Math.round(finalPercent × 0.90) + ' / 90'
- Score color logic (for reference — used in frontend):
  80-90: success green
  50-79: warning amber
  0-49:  error red
- No difficulty field on any question model

## Cloudinary Rules
- Audio files: resource_type = 'video' (not 'audio')
- Image files: resource_type = 'image'
- Audio folder: ptepath/listening/audio
- Image folder: ptepath/speaking/images
- Delete from Cloudinary when question deleted

## STT Adapter Rule
- Only stt.adapter.ts imports groq-sdk
- All speaking scoring calls only this adapter
- Never import groq-sdk directly in controllers or scoring files

## Security Rules
- Never return passwordHash, tokenVersion, resetTokenHash in any response
- Rate limiter on /api/auth/login only (5 per 15 min per IP)
- Forgot password always returns same message regardless of email existence
- Reset token: hashed in DB, raw in email, expires 10 min
- bcryptjs salt round: 12

## Swagger Docs Rule
Swagger spec lives in src/config/swagger.ts.
Only add a module to the spec AFTER its controller is fully implemented (not stubs).
When completing an instruction file, update swagger.ts:
- Add the module's tag to the `tags` array
- Add all its schemas to `components.schemas`
- Add all its paths to `paths`
Follow the same pattern as the existing Auth section.
Docs are served at GET /api/docs (Swagger UI) and GET /api/docs.json (raw spec).