# 06 — Project Structure - DONE

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/06-project-structure.md and implement exactly what is described."

---

## What to Build
Set up the complete folder and file structure for both backend and frontend.
No logic implemented yet — only structure, configuration files, and base setup.

---

## Reference Docs
- `docs/md/theming.md` — for frontend font and CSS variable setup
- `docs/md/authentication-blueprint.md` — for environment variable names

---

## Backend Structure

Create the following inside `backend/`:

````
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── cloudinary.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── student.controller.ts
│   │   ├── speaking.controller.ts
│   │   ├── writing.controller.ts
│   │   ├── reading.controller.ts
│   │   ├── listening.controller.ts
│   │   └── mocktest.controller.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── errorHandler.ts
│   │   └── upload.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── speaking-question.model.ts
│   │   ├── writing-question.model.ts
│   │   ├── reading-question.model.ts
│   │   ├── listening-question.model.ts
│   │   └── mocktest-template.model.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── student.routes.ts
│   │   ├── speaking.routes.ts
│   │   ├── writing.routes.ts
│   │   ├── reading.routes.ts
│   │   ├── listening.routes.ts
│   │   └── mocktest.routes.ts
│   ├── services/
│   │   ├── stt.adapter.ts
│   │   ├── email.service.ts
│   │   └── cloudinary.service.ts
│   ├── scoring/
│   │   ├── speaking.scoring.ts
│   │   ├── writing.scoring.ts
│   │   ├── reading.scoring.ts
│   │   └── listening.scoring.ts
│   ├── utils/
│   │   ├── jwt.utils.ts
│   │   ├── hash.utils.ts
│   │   └── token.utils.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── scripts/
│   └── seed-admin.ts
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
└── nodemon.json
````

---

## Backend Configuration Files to Create

### `package.json`
Initialize with these dependencies:

**Dependencies:**
- express
- mongoose
- dotenv
- cors
- cookie-parser
- multer
- express-rate-limit
- bcryptjs
- jsonwebtoken
- resend
- cloudinary
- multer-storage-cloudinary
- nspell
- dictionary-en
- fastest-levenshtein
- groq-sdk

**Dev Dependencies:**
- typescript
- ts-node
- nodemon
- @types/express
- @types/node
- @types/cors
- @types/cookie-parser
- @types/multer
- @types/bcryptjs
- @types/jsonwebtoken

**Scripts:**
```json
{
  "dev": "nodemon",
  "build": "tsc",
  "start": "node dist/app.js",
  "seed": "ts-node scripts/seed-admin.ts"
}
```

---

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

### `nodemon.json`
```json
{
  "watch": ["src"],
  "ext": "ts",
  "exec": "ts-node src/app.ts"
}
```

---

### `src/app.ts` — Entry Point (Skeleton Only)
Create entry point that:
- Loads dotenv
- Creates Express app
- Applies middleware (cors, json parser, cookie-parser)
- Registers all route files
- Connects to MongoDB
- Starts server on PORT from .env (default 5000)
- Applies global error handler middleware

---

### `src/config/db.ts`
MongoDB connection using MONGO_URI from .env.
Log success or error on connection.

---

### `src/config/cloudinary.ts`
Configure Cloudinary using:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
All from .env.

---

### `src/types/index.ts`
Define shared TypeScript types used across the project:
- `AuthRequest` — Express Request extended with `user: { userId: string, role: string }`
- `JwtPayload` — `{ userId: string, role: string, tokenVersion: number }`
- `UserRole` — enum: `'student' | 'admin'`
- `ScoreResult` — base type for all score responses

---

### `src/middleware/upload.ts`
Configure Multer with Cloudinary storage:
- Audio upload: folder `ptepath/listening/audio`, resource_type `video`, max 5MB
- Image upload: folder `ptepath/speaking/images`, resource_type `image`, max 5MB
- Accepted audio formats: mp3, wav, m4a, webm, mp4
- Accepted image formats: jpg, jpeg, png

Export two multer instances:
- `uploadAudio` — for listening question audio
- `uploadImage` — for speaking describe-image questions

---

### `src/middleware/errorHandler.ts`
Global error handler middleware.
Catches all errors passed via `next(error)`.
Returns JSON: `{ success: false, message: string }`.
In development include error stack. In production omit stack.

---

## Frontend Structure

Create the following inside `frontend/`:

````
frontend/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx               ← Landing page
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── change-password/
│   │   │       └── page.tsx
│   │   ├── (student)/
│   │   │   ├── layout.tsx             ← Student layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── speaking/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [type]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   ├── writing/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [type]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   ├── reading/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [type]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   ├── listening/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [type]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx
│   │   │   ├── mock-tests/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── attempt/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── result/
│   │   │   │       └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx             ← Admin layout with sidebar
│   │   │   ├── admin/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── students/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── speaking/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── writing/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reading/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── listening/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── mock-tests/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   ├── not-found.tsx              ← 404 page
│   │   ├── error.tsx                  ← 500 / error page
│   │   ├── layout.tsx                 ← Root layout
│   │   └── globals.css                ← Global CSS with variables
│   ├── components/
│   │   ├── ui/                        ← shadcn/ui components go here
│   │   ├── shared/                    ← Shared custom components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── ScoreDisplay.tsx
│   │   │   └── AudioPlayer.tsx
│   │   ├── speaking/
│   │   ├── writing/
│   │   ├── reading/
│   │   ├── listening/
│   │   └── admin/
│   ├── lib/
│   │   ├── api.ts                     ← Axios instance with interceptor
│   │   └── utils.ts                   ← shadcn utility (cn function)
│   ├── store/
│   │   └── auth.store.ts              ← Zustand auth store
│   ├── hooks/
│   │   └── useAuth.ts
│   └── types/
│       └── index.ts
├── public/
├── .env.local
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.ts
````

---

## Frontend Configuration Files to Create

### Initialize Next.js Project
```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Install Additional Packages
```bash
npm install axios zustand
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npx shadcn@latest init
```

shadcn init settings:
- Style: Default
- Base color: Slate
- CSS variables: Yes

### Install shadcn Components Needed
```bash
npx shadcn@latest add button input label textarea card badge
npx shadcn@latest add dialog alert-dialog dropdown-menu
npx shadcn@latest add table toast progress separator
npx shadcn@latest add select switch tabs
```

---

### `src/app/globals.css`
Add complete CSS variable token set from `docs/md/theming.md`.
Include Google Fonts import for Outfit (700, 800, 900) and Inter (400, 500, 600).
Apply base font: `font-family: var(--font-body)` on body.
Apply display font: `font-family: var(--font-display)` on headings.

---

### `src/lib/api.ts`
Create Axios instance:
- Base URL from `NEXT_PUBLIC_API_URL` environment variable
- `withCredentials: true` (so cookies are sent automatically)
- Request interceptor: attach Access Token from Zustand store to Authorization header
- Response interceptor: on 401 response → call refresh endpoint → retry original request → on refresh failure redirect to /login

---

### `src/store/auth.store.ts`
Zustand store with:
- State: `user`, `accessToken`, `isAuthenticated`, `isLoading`
- Actions: `setAuth`, `clearAuth`, `setLoading`
- User type: `{ id, name, email, role, isFirstLogin }`

---

### `src/app/layout.tsx` — Root Layout
- Import Google Fonts (Outfit + Inter) using next/font/google
- Apply fonts to html element
- Include globals.css
- Wrap children — no auth context here (handled by Zustand)

---

### `frontend/.env.local`
````
NEXT_PUBLIC_API_URL=http://localhost:5000/api
````

---

## Expected Output When Done

### Backend
- All folders and files created
- `npm install` runs successfully
- `npm run dev` starts server on port 5000
- No TypeScript errors
- MongoDB connection log appears on startup

### Frontend
- All folders and files created
- `npm install` runs successfully
- `npm run dev` starts on port 3000
- Landing page route (`/`) loads without errors
- No TypeScript errors
- CSS variables from theming.md are in globals.css

---

## Verification Steps
1. Run `cd backend && npm run dev` — server starts, MongoDB connected message appears
2. Run `cd frontend && npm run dev` — Next.js starts on localhost:3000
3. Visit localhost:3000 — no crash (blank page or placeholder is fine)
4. Visit localhost:5000/api — returns 404 JSON (no routes yet, that is expected)

---

## Notes
- Do not implement any logic yet — only structure and configuration
- All controller files should export empty placeholder functions
- All route files should register routes but handlers can be empty
- All model files should export empty mongoose schemas (filled in next steps)
- Keep all .env files out of git — verify .gitignore is working
- nspell initialisation (load dictionary once at server start) is set up
  in app.ts but the actual spell check function is implemented in writing.scoring.ts

Also add these additional frontend packages: @tanstack/react-query and @tanstack/react-query-devtools. Add a src/lib/query-client.ts file to the frontend structure. Wrap children in QueryClientProvider in root layout. All interactive components will use 'use client' directive — default to Server Components everywhere else

## Next Step
→ Give Claude Code `07-authentication-backend.md`
