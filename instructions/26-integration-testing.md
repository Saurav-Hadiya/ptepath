# 26 — Integration Testing

## What This Is
Manual testing guide + Claude Code fixes.
You follow the testing checklist yourself.
When bugs found: describe the bug to Claude Code and ask it to fix.

---

## What to Test
End-to-end testing of the complete platform.
Every flow from login to scoring to admin management.
Run these tests before deploying frontend to Vercel.

---

## Prerequisites
- All backend files complete and deployed to Render (14-backend-deploy-render.md)
- All frontend files complete and running locally (15 through 24)
- At least one admin account created (seed script run)
- Frontend .env.local pointing to Render backend URL

---

## How to Run Tests

Backend: running on Render (live)
Frontend: running locally on localhost:3000
Use: browser + browser dev tools + Postman (optional)

For each test:
  ✓ Pass — move to next
  ✗ Fail — note the bug, fix with Claude Code, re-test

---

## BLOCK 1 — Authentication Tests

### 1.1 Admin Login
```
Steps:
  1. Visit localhost:3000/login
  2. Enter admin email + password
  3. Click Sign In

Expected:
  Redirected to /admin/dashboard
  Admin name visible in sidebar
  "Admin Panel" amber badge visible
```

### 1.2 Student Login — Normal
```
Steps:
  1. Create a student from admin panel first (Block 4)
  2. Logout from admin
  3. Login as student

Expected:
  Redirected to /dashboard
  Student name visible in sidebar
  No "Admin Panel" badge
```

### 1.3 Student Login — First Login Force Password Change
```
Steps:
  1. Create new student from admin panel
  2. Login as that student

Expected:
  Redirected to /change-password
  Cannot navigate to /dashboard (redirected back)
  Set new password → redirected to /dashboard
  isFirstLogin = false in DB
```

### 1.4 Wrong Credentials
```
Steps:
  1. Enter wrong password on login page

Expected:
  Error message shown: "Invalid email or password"
  Not redirected
  Error clears when user starts typing again
```

### 1.5 Rate Limiting
```
Steps:
  1. Enter wrong password 5 times rapidly

Expected:
  After 5th attempt: "Too many login attempts. Please try again in 15 minutes."
  429 status in network tab
```

### 1.6 Forgot Password
```
Steps:
  1. Visit /forgot-password
  2. Enter any email (existing or not)
  3. Submit

Expected:
  Always shows success message (even for non-existent email)
  If real student email: check email for reset link
```

### 1.7 Password Reset
```
Steps:
  1. Click reset link from email
  2. Enter new password
  3. Submit

Expected:
  Success message shown
  Can login with new password
  Old password no longer works
  Reset link cannot be used again (shows "invalid link")
```

### 1.8 Token Refresh
```
Steps:
  1. Login as student
  2. Wait 16 minutes (access token expires at 15 min)
  3. Navigate to any page or click any button

Expected:
  Still logged in (refresh token used silently)
  No redirect to login
  Network tab: /api/auth/refresh called automatically
```

### 1.9 Logout
```
Steps:
  1. Click logout button

Expected:
  Redirected to /login
  Cannot go back to /dashboard (redirected to /login)
  httpOnly cookie cleared in browser Application tab
```

### 1.10 Disabled Student Account
```
Steps:
  1. Admin disables a student account
  2. Try to login as that student

Expected:
  Login shows: "Your account has been disabled. Please contact your administrator."
  Cannot access any page
```

---

## BLOCK 2 — Speaking Module Tests

### 2.1 Speaking Module Home
```
Steps:
  1. Login as student
  2. Click Speaking in sidebar

Expected:
  5 question type cards visible
  Each shows correct description
  Question counts shown (0 if no questions added yet)
```

### 2.2 Add Speaking Question (Admin)
```
Steps:
  1. Login as admin
  2. Go to Admin → Speaking
  3. Read Aloud tab → Add Question
  4. Enter passage text + speaking time
  5. Save

Expected:
  Question appears in list
  attemptCount: 0, avgScore: 0
  Status toggle: active (green)
```

### 2.3 Read Aloud Attempt
```
Steps:
  1. Login as student
  2. Speaking → Read Aloud → select question
  3. Allow microphone
  4. Wait for prep timer → recording starts
  5. Read passage → recording stops
  6. Wait for score

Expected:
  Prep timer counts down (30 sec)
  Recording starts automatically
  Waveform animation shows during recording
  "Analysing your response..." shows after recording
  Score appears within 5 seconds
  Content, Fluency, Pronunciation bars shown
  Feedback message shown
```

### 2.4 Read Aloud — Mic Denied
```
Steps:
  1. Block microphone in browser
  2. Attempt Read Aloud question

Expected:
  MicDeniedError component shown
  Instructions for enabling mic shown per browser
  No crash
```

### 2.5 Repeat Sentence Attempt
```
Steps:
  1. Go to Repeat Sentence question
  2. Attempt it

Expected:
  Sentence NOT visible initially
  TTS speaks the sentence aloud
  Recording starts after TTS finishes
  After scoring: sentence revealed below score
```

### 2.6 Describe Image Attempt
```
Steps:
  1. Admin adds a Describe Image question with image
  2. Student attempts it

Expected:
  Image visible during prep and recording
  Score shows Fluency + Pronunciation + Engagement bars
```

### 2.7 Answer Short Question
```
Steps:
  1. Admin adds Answer Short Question with accepted answers
  2. Student attempts, gives correct answer

Expected:
  Question spoken by TTS
  After scoring: correct answer revealed
  Score 70%+ for correct answer
  Score 0% for completely wrong answer
```

---

## BLOCK 3 — Writing Module Tests

### 3.1 Summarise Written Text
```
Steps:
  1. Admin adds SWT question
  2. Student attempts it
  3. Type a summary (10 words)

Expected:
  Word counter shows live count
  Submit button enabled at 5+ words
  Submit button disabled below 5 words
  Word counter green when 5-75 words
  Score shows Word Count + Spelling bars
  Misspelled words shown if any
```

### 3.2 SWT — Word Limit Enforcement
```
Steps:
  1. Keep typing until word counter reaches 75

Expected:
  Cannot type more after 75 words
  Counter turns red
  No crash or error
```

### 3.3 SWT — Timer Auto-Submit
```
Steps:
  1. Start SWT question
  2. Type 10 words
  3. Wait for 10-minute timer to expire (or set shorter timer in backend for testing)

Expected:
  Auto-submits when timer reaches 0
  Shows "Time is up" toast
  Score displayed
```

### 3.4 Write Essay
```
Steps:
  1. Admin adds Essay question
  2. Student types essay

Expected:
  Word counter grey below 100
  Word counter amber at 100-199
  Word counter green at 200-300
  Blocked at 300 words
  Score shows correct feedback
```

---

## BLOCK 4 — Reading Module Tests

### 4.1 R&W Fill in the Blanks
```
Steps:
  1. Admin adds RW Fill Blanks question with word pool
  2. Student attempts

Expected:
  Word pool chips draggable
  Dragging to blank removes from pool
  Dragging back to pool removes from blank
  After submit: correct = green, wrong = red + correct answer shown
```

### 4.2 MCQ Multiple Answers
```
Steps:
  1. Admin adds MCQ Multiple question
  2. Student selects all correct + one wrong option
  3. Submit

Expected:
  Negative marking warning visible
  After submit: correct selected = green, wrong selected = red, missed = amber
  Score correctly calculates with negative marking
  Score cannot go below 0
```

### 4.3 Re-order Paragraphs
```
Steps:
  1. Admin adds Reorder question with 4 paragraphs
  2. Student drags into order

Expected:
  Paragraphs shuffled (not in correct order on load)
  Drag works from source to answer panel
  Reordering within answer panel works
  After submit: student order vs correct order shown
  Pair-based score calculated correctly
```

### 4.4 MCQ Single Answer
```
Steps:
  1. Admin adds MCQ Single question
  2. Student selects correct answer

Expected:
  Only one option selectable (radio)
  After submit: correct option highlighted green
  Score: 90/90 for correct, 0/90 for wrong
```

---

## BLOCK 5 — Listening Module Tests

### 5.1 Audio Player
```
Steps:
  1. Admin adds any listening question with audio
  2. Student opens question

Expected:
  Audio player visible at top
  Play button works
  Progress bar shows playback position
  "Plays once" badge shown if playLimit = 1
  After 1 play: play button disabled if playLimit = 1
```

### 5.2 Write from Dictation
```
Steps:
  1. Admin adds Write Dictation question
  2. Student listens and types

Expected:
  Audio plays
  Student types in input
  After submit: word-by-word breakdown shown
  Correct sentence revealed
  Exact matches: green, close matches: amber, missed: red
```

### 5.3 Highlight Incorrect Words
```
Steps:
  1. Admin adds Highlight Incorrect question
  2. Student clicks 2 correct words + 1 wrong word
  3. Submit

Expected:
  Words clickable, toggle on/off
  After submit: correct clicks green, wrong click red, missed amber
  Score accounts for negative marking on wrong click
```

### 5.4 Fill in the Blanks — Fuzzy Match
```
Steps:
  1. Admin adds Fill Blanks question (e.g. correct: "population")
  2. Student types "populaion" (minor typo, distance 1)
  3. Submit

Expected:
  "~ Close" shown for this blank
  Partial credit (0.7 pts) reflected in score
  Not marked as completely wrong
```

---

## BLOCK 6 — Mock Test Tests

### 6.1 Start Mock Test
```
Steps:
  1. Admin creates template with 3-5 questions (mix of types)
  2. Student goes to Mock Tests
  3. Clicks "Start Test"
  4. Confirms

Expected:
  Confirmation modal shows rules
  On confirm: test loads
  Full-screen layout (no sidebar)
  Progress bar shows Q1 of N
  Overall timer starts
```

### 6.2 Complete Mock Test
```
Steps:
  1. Answer all questions
  2. Click "Submit Test" on last question

Expected:
  All modules scored
  Result page shows overall score
  4 module scores shown
  Time taken shown
```

### 6.3 Mock Test Auto-Submit
```
Steps:
  1. Start mock test
  2. Let overall timer reach 0
     (set totalTime to 1 minute for testing via admin)

Expected:
  Timer turns red when low
  Auto-submits when reaches 0
  Result page shown
  Unanswered questions scored as 0
```

### 6.4 Try Again
```
Steps:
  1. Complete mock test
  2. Click "Try Again"

Expected:
  Returns to /mock-tests
  Start same template again
  Different random questions generated
```

---

## BLOCK 7 — Admin Management Tests

### 7.1 Create Student
```
Steps:
  1. Admin Panel → Students → Add Student
  2. Fill name, email, temporary password
  3. Submit

Expected:
  Student appears in list
  isFirstLogin: true (shown via "First Login" indicator)
  Student can login with temporary password
```

### 7.2 Reset Student Password
```
Steps:
  1. Select student → Reset Password
  2. Enter new temporary password

Expected:
  Student's next login forced to change password
  Any active sessions for student are invalidated
  Student receives 401 on next API call → redirected to login
```

### 7.3 Disable Student
```
Steps:
  1. Toggle student status to inactive

Expected:
  Student cannot login
  If student is currently logged in:
    Next API call returns 403
    Student redirected to login with disabled message
```

### 7.4 Question CRUD
```
For each module (Speaking, Writing, Reading, Listening):
  Add question → appears in list ✓
  Edit question → changes saved ✓
  Toggle inactive → disappears from student view ✓
  Toggle active again → reappears ✓
  Delete → removed from list ✓
  Delete with media (describe_image / listening audio) →
    media removed from Cloudinary ✓
```

### 7.5 Mock Test Template
```
Steps:
  1. Create template with 2 questions per type
  2. Start test as student
  3. Verify correct number of questions loaded

Expected:
  Questions match template rules
  Different questions each attempt
  Template attempt count increments after test completion
```

---

## BLOCK 8 — Cross-Browser Tests

Test these browsers:
```
Chrome (desktop):     Full test suite
Firefox (desktop):    Auth + one module per type
Safari (desktop):     Auth + speaking (mic test)
Chrome (Android):     Speaking module (mic + recording)
Safari (iOS):         Speaking module (mic + recording)
```

Known considerations:
```
iOS Safari:
  MediaRecorder available from iOS 14.5+
  Audio recorded as MP4 (not WebM) — both accepted by Groq
  Check: mic permission prompt appears

Android Chrome:
  Full support — should work same as desktop Chrome

Firefox:
  Web Speech Synthesis voices may differ — still functional
```

---

## BLOCK 9 — Responsive Design Tests

Test at these breakpoints:
```
Desktop (1440px):    All pages — full layout
Laptop (1024px):     All pages — check sidebar doesn't overlap
Tablet (768px):      Dashboard, module pages — 2-column layouts
Mobile (390px):      Login, dashboard, attempt pages, mock test
```

Key checks on mobile:
```
Sidebar: hidden (hamburger or drawer navigation)
Speaking record button: large enough to tap
Audio player: full width, play button tappable
MCQ options: min 44px height per option
Word counter: visible on small screens
Mock test progress: readable
Tables: horizontally scrollable
Forms: inputs not too small to tap
```

---

## BLOCK 10 — Edge Case Tests

### 10.1 Empty Question Banks
```
Admin deletes all questions of a type.
Student views that question type.

Expected:
  EmptyState shown
  No crash
```

### 10.2 No Mock Tests Available
```
Admin deactivates all templates.
Student visits /mock-tests.

Expected:
  EmptyState shown
  No crash
```

### 10.3 Network Error During Scoring
```
Disconnect internet after recording, before submit.

Expected:
  Error toast shown
  Student can try again
  No frozen loading state
```

### 10.4 Groq API Slow
```
Speaking evaluate — Groq sometimes slow (2-5 sec).

Expected:
  "Analysing your response..." loading state shown
  No timeout or crash
  Score appears when ready
```

### 10.5 Page Refresh During Attempt
```
Refresh page mid-writing-attempt.

Expected:
  Attempt lost (acceptable — documented in platform)
  Returns to question page
  No crash or error
```

### 10.6 Duplicate Email
```
Admin tries to create student with existing email.

Expected:
  Error shown: "A student with this email already exists."
  Form not cleared (admin can fix and retry)
```

### 10.7 Invalid Reset Link
```
Visit /reset-password without token param.
Visit /reset-password with expired token.

Expected:
  First: "Invalid reset link" state shown
  Second: "This link has expired" state shown
  Both: no crash
```

---

## Bug Fixing Process

When a bug is found:
```
1. Note exact steps to reproduce
2. Note expected vs actual behaviour
3. Check browser console for errors
4. Check network tab for failed API calls
5. Tell Claude Code:
   "When I do [steps], the expected behaviour is [X]
    but instead [Y] happens.
    The error in console is [Z].
    Fix this bug."
6. Claude Code fixes it
7. Re-test the specific scenario
8. Continue with remaining tests
```

---

## Performance Checks

```
Page load times (acceptable ranges):
  /login:          < 2 seconds
  /dashboard:      < 3 seconds (API call included)
  /speaking:       < 2 seconds
  Attempt page:    < 3 seconds
  Score display:   < 6 seconds (Groq included for speaking)
  Mock test load:  < 5 seconds (loads all questions)
  Admin dashboard: < 4 seconds

Backend cold start (Render free tier):
  First request after 15+ min idle: 30-60 seconds
  Subsequent requests: normal speed
  This is acceptable for MVP
```

---

## Testing Complete Checklist

```
Block 1 — Authentication:     □ All 10 tests pass
Block 2 — Speaking:           □ All 7 tests pass
Block 3 — Writing:            □ All 4 tests pass
Block 4 — Reading:            □ All 4 tests pass
Block 5 — Listening:          □ All 4 tests pass
Block 6 — Mock Test:          □ All 4 tests pass
Block 7 — Admin:              □ All 5 tests pass
Block 8 — Cross-browser:      □ Tested on 5 browsers
Block 9 — Responsive:         □ Tested on 4 breakpoints
Block 10 — Edge Cases:        □ All 7 cases handled
```

When all blocks checked:
Platform is ready for deployment.

---

## Notes
- Fix bugs as you find them — do not accumulate
- Test one block completely before moving to next
- Mobile mic testing requires real device — emulator may not work
- Groq free tier: 7200 sec/day — enough for testing but be mindful
- Ask Claude Code to fix one bug at a time — not multiple bugs in one session
- After every Claude Code fix: commit to GitHub before continuing
- Render free tier sleeps after 15 min — test backend wake-up time

## Next Step
→ Follow `27-frontend-deploy-vercel.md`
