# PTEPath — PTE Exam Practice Platform

## Project Overview
Closed PTE exam practice platform.
Admin creates student accounts. Students practice Speaking, Writing,
Reading, Listening modules and take mock tests.
No public registration. Rule-based scoring only.
STT for Speaking via Groq Whisper API.

## Repository Structure
PTEPLATFORM/

├── backend/          Node.js + Express + TypeScript API

├── frontend/         Next.js 15 + TypeScript frontend

├── docs/md/          Blueprint documents (reference these for logic)

├── docs/source/      Original .docx files

├── design_reference/ HTML mockup files for all pages

└── instructions/     Step-by-step build instruction files

## Tech Stack
Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS,
          shadcn/ui, Zustand, TanStack Query, Axios,
          @dnd-kit/core, @dnd-kit/sortable
Backend:  Node.js, Express, TypeScript, ts-node, nodemon
Database: MongoDB Atlas + Mongoose
Auth:     bcryptjs + jsonwebtoken (custom JWT — no third party)
Storage:  Cloudinary (audio resource_type='video', images resource_type='image')
STT:      Groq Whisper API (model: whisper-large-v3-turbo)
Email:    Resend
Spell:    nspell + dictionary-en
Fuzzy:    fastest-levenshtein
Hosting:  Vercel (frontend) + Render (backend)

## Blueprint Documents — Always Reference These
docs/md/speaking-module.md       — Speaking scoring, DB schema, routes
docs/md/writing-module.md        — Writing scoring, DB schema, routes
docs/md/reading-module.md        — Reading scoring, DB schema, routes
docs/md/listening-module.md      — Listening scoring, DB schema, routes
docs/md/mocktest-blueprint.md    — Mock test logic, template system
docs/md/authentication-blueprint.md — Auth flows, JWT, security
docs/md/theming.md               — Colors, typography, CSS variables

## Design Reference Files
design_reference/Landing_Page_Redesign.html     — Landing page
design_reference/Section1_Public_Auth_Pages.html — Auth pages
design_reference/Section2_Student_Portal.html   — Student portal
design_reference/Section3_Admin_Portal.html     — Admin portal
design_reference/theming.md
design_reference/PTEPath_Theming.docx

## Key Platform Decisions
- Closed platform — no public registration ever
- No per-attempt records stored — only question counters updated
- Rolling average formula: ((currentAvg × currentCount) + newScore) / (currentCount + 1)
- All scores out of 90 (real PTE scale)
- displayScore = Math.round(finalPercent × 0.90) + ' / 90'
- No difficulty field anywhere — removed from this platform
- Student audio recordings never stored — discarded after scoring
- Correct answers never sent to frontend before submission
- Single monorepo — backend/ and frontend/ in same repository

## Instruction Files
Follow instructions/XX-filename.md one at a time.
Each file is one focused task.
Complete, test, and commit before moving to next.