# 01 — GitHub Setup

## What This Is
This is a manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What You Will Do
- Create a GitHub account (if not already done)
- Create one monorepo for the entire PTEPath project
- Set up the initial folder structure
- Push everything to GitHub

---

## Step 1 — Create GitHub Account
1. Go to github.com
2. Click Sign Up
3. Enter email, password, username
4. Verify email
5. Done

If you already have a GitHub account, skip this step.

---

## Step 2 — Create New Repository
1. Log in to GitHub
2. Click the `+` icon (top right) → New repository
3. Fill in:
   - **Repository name:** `ptepath` (or `ptepath-platform`)
   - **Description:** PTE Exam Practice Platform
   - **Visibility:** Private (recommended — keep client project private)
   - **Initialize with README:** Yes (tick this)
   - **Add .gitignore:** Node
4. Click **Create repository**

---

## Step 3 — Clone Repository to Your Machine
1. On the repository page click the green **Code** button
2. Copy the HTTPS URL (looks like: `https://github.com/yourusername/ptepath.git`)
3. Open terminal on your machine
4. Run:
```bash
git clone https://github.com/yourusername/ptepath.git
cd ptepath
```

---

## Step 4 — Create the Folder Structure
Inside the cloned repository folder, create these folders and files:

```bash
mkdir instructions
mkdir -p docs/source
mkdir -p docs/md
mkdir design_reference
mkdir backend
mkdir frontend
```

Create a root `.gitignore` file:
```bash
touch .gitignore
```

Paste this into the root `.gitignore`:
````
# Environment files — never commit these
.env
.env.local
.env.production
*.env

# Node modules
node_modules/
backend/node_modules/
frontend/node_modules/
frontend/.next/

# Build outputs
backend/dist/
frontend/.next/
frontend/out/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# TypeScript
*.tsbuildinfo
````

---

## Step 5 — Move Existing Files Into Correct Folders

You already have these files on your machine. Move them into the repo:

- All `.docx` blueprint files → `docs/source/`
- All `.md` blueprint files → `docs/md/`
- All HTML design reference files → `design_reference/`

---

## Step 6 — Create README.md
Replace the default README with this:

```markdown
# PTEPath — PTE Exam Practice Platform

Private repository for the PTEPath platform development.

## Structure
- `backend/` — Node.js + Express + TypeScript API
- `frontend/` — Next.js 15 + TypeScript + Tailwind CSS
- `docs/md/` — Module blueprint documents (Claude Code reference)
- `docs/source/` — Original .docx blueprint documents
- `design_reference/` — HTML UI reference designs
- `instructions/` — Step-by-step build instruction files

## Tech Stack
- Frontend: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- Backend: Node.js, Express, TypeScript
- Database: MongoDB Atlas
- Hosting: Vercel (frontend) + Render (backend)
```

---

## Step 7 — First Commit and Push
```bash
git add .
git commit -m "initial project structure"
git push origin main
```

---

## Step 8 — Verify on GitHub
1. Go to your repository on github.com
2. Confirm you can see all folders:
   - `backend/`
   - `frontend/`
   - `docs/`
   - `instructions/`
   - `design_reference/`
3. Confirm `.gitignore` is present
4. Confirm `README.md` is updated

---

## Done ✓
GitHub repository is ready.
All future work will be committed and pushed here.

## Next Step
→ Follow `02-mongodb-atlas-setup.md`