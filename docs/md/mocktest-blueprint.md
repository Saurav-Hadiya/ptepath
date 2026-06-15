# Mock Test — Complete Blueprint

## Overview

**Platform:** PTEPath — PTE Exam Practice Platform
**Feature:** Mock Test
**Approach:** Auto-generated from admin-defined template. Random questions each attempt.
**Scoring:** Exact same functions as individual module practice. Zero new scoring logic.
**Storage:** No per-attempt records. Template counters only.
**Cost:** Rs. 0

---

## How Mock Test Differs from Individual Practice

| Aspect | Individual Practice | Mock Test |
|---|---|---|
| Scope | One module, one question | All 4 modules in one session |
| Question choice | Student picks freely | System auto-selects from template |
| Timer | Per-question only | Overall timer + per-question limits |
| Navigation | Retry freely | Forward only — no going back |
| Score shown | After each question | After full test completes |
| Correct answers | After each question | After full test completes |
| Storage | Question counters only | Template counters only |
| Retake | Unlimited | Unlimited — new random questions each time |

---

## Admin Side — Template Management

### Admin Panel Structure
````
Admin Panel → Mock Tests
├── Template List   (attempt count + avg score per template)
├── Create Template
├── Edit Template
├── Delete Template
└── Toggle Active / Inactive
````

### Creating a Template — Step by Step

1. Navigate: Admin Panel → Mock Tests → Create Template
2. Enter template name and description (shown to students)
3. Set total time limit in minutes (recommended: 90 minutes)
4. Define questions per type — for each module and question type, enter how many questions to include
5. Save — template immediately available to students if set to Active

### Recommended Standard Template

| Module | Question Type | Count | Per-Question Time |
|---|---|---|---|
| Speaking | Read Aloud | 1 | 40 sec |
| Speaking | Repeat Sentence | 1 | 15 sec |
| Speaking | Describe Image | 1 | 40 sec |
| Speaking | Respond to Situation | 1 | 40 sec |
| Speaking | Answer Short Question | 1 | 10 sec |
| Writing | Summarise Written Text | 1 | 10 min |
| Writing | Write Essay | 1 | 20 min |
| Reading | R&W Fill in the Blanks | 1 | No limit |
| Reading | MCQ Multiple Answers | 1 | No limit |
| Reading | Reorder Paragraphs | 1 | No limit |
| Reading | Reading Fill in Blanks | 1 | No limit |
| Reading | MCQ Single Answer | 1 | No limit |
| Listening | MCQ Multiple Answers | 1 | Audio + 60 sec |
| Listening | Fill in the Blanks | 1 | Audio + 60 sec |
| Listening | MCQ Single Answer | 1 | Audio + 60 sec |
| Listening | Write from Dictation | 1 | Audio + 60 sec |
| Listening | Highlight Incorrect Words | 1 | Audio + 60 sec |

**Total: 17 questions. Total time: 90 minutes.**

> Note: Reading questions have no per-question time limit — overall test timer handles pressure. Speaking and Writing keep their existing per-question timers.

### Template List Columns (Admin View)

| Column | Description |
|---|---|
| Template Name | e.g. Standard Mock Test |
| Total Questions | Sum of all question counts |
| Time Limit | Total minutes |
| Attempt Count | Incremented per submission |
| Avg Score | Rolling average — updated per submission |
| Status | Active / Inactive toggle |
| Actions | Edit and Delete |

---

## Student Side — Complete Flow

### Pre-Test Confirmation Screen
Student sees before starting:
````
Test Name
Total Questions: 18
Total Time: 90 minutes
Modules: Speaking, Writing, Reading, Listening

Rules:
- You cannot go back to a previous question
- Test auto-submits when time runs out
- Speaking questions have their own time limits
- Writing questions have their own time limits
- You can retake as many times as you like

[ Cancel ]   [ Start Test ]
````

### During the Test — Flow
1. Student navigates to Mock Tests from dashboard
2. Available templates listed with name, question count, time limit
3. Student clicks Start Mock Test on chosen template
4. Confirmation screen shown → student clicks Confirm
5. System randomly selects questions from question bank per template rules
6. Overall countdown timer starts
7. Questions presented one by one: Speaking → Writing → Reading → Listening
8. Student answers each question → clicks Next (cannot go back)
9. When all answered OR timer reaches zero → test auto-submits
10. Score screen shown immediately
11. Student can view question breakdown + correct answers, then exit or retake

### UI Elements Always Visible During Test

| Element | What It Shows |
|---|---|
| Overall Timer | Countdown. Turns red under 10 minutes. |
| Progress Indicator | "Question 7 of 18" |
| Module Label | Speaking / Writing / Reading / Listening |
| Question Type Label | e.g. "Read Aloud", "Write Essay" |
| Next Button | Enabled only after answer given or per-question timer expires |

### Navigation Rules

| Rule | Detail |
|---|---|
| Forward only | Cannot return to previous question after clicking Next |
| Must answer to proceed | Next disabled until answer given. Exception: per-question timer auto-advances. |
| Speaking auto-advance | Speaking timer ends → recording auto-submits → wait for Groq scoring → advance |
| Writing auto-advance | Writing timer ends → response auto-submits → advance |
| Overall timer expires | All answered questions scored. Unanswered = 0. Test auto-submits. |
| Unanswered question | Scores 0%. Included in module average. |

---

## Scoring

### Per-Question Scoring
Every question uses the **exact same scoring functions** as individual module practice.
**Zero new scoring code.**

| Module | Functions Used | Source |
|---|---|---|
| Speaking | STT Adapter + content/fluency/pronunciation per type | Speaking module |
| Writing | Word count + nspell spelling | Writing module |
| Reading | Exact match / pair-based / negative marking per type | Reading module |
| Listening | All Reading + Writing functions + fuzzy match | Listening module |

### Module Score Calculation
````
Module score = average of all question scores in that module

Example — Speaking (5 questions):
Read Aloud:            72%
Repeat Sentence:       85%
Describe Image:        68%
Respond to Situation:  74%
Answer Short Question: 100%
Speaking Score = (72 + 85 + 68 + 74 + 100) / 5 = 79.8% → 72 / 90
````

### Overall Score Calculation
````
Overall = average of all 4 module scores (equal weight)

Example:
Speaking:  79.8%
Writing:   91.0%
Reading:   83.3%
Listening: 76.5%
Overall = (79.8 + 91.0 + 83.3 + 76.5) / 4 = 82.7% → 74 / 90
````

### Speaking Exception in Mock Test
Speaking questions are scored **during the test** via Groq Whisper — not at final submit.

````
Student records speaking answer
        ↓
Audio sent to Groq immediately
        ↓
Show "Scoring your response..." (2–5 seconds)
        ↓
Score returned → stored in frontend state
        ↓
Test advances to next question
        ↓
At final submit: speaking score VALUES sent — not audio files
Audio discarded immediately after scoring
````

---

## Score Screen — What Student Sees

### Overall Score Screen
````
Mock Test Complete!
─────────────────────────────────────
Overall Score:    74 / 90

Speaking          72 / 90   79%   ████████░░
Writing           82 / 90   91%   █████████░
Reading           75 / 90   83%   ████████░░
Listening         69 / 90   76%   ███████░░░

Questions Answered: 18 / 18
Time Taken:         67 / 90 minutes
─────────────────────────────────────
[ View Question Breakdown ]   [ Try Again ]
````

### Question Breakdown Screen
Shown when student clicks "View Question Breakdown":
````
Speaking
  Q1  Read Aloud           72%   [ View Details ]
  Q2  Repeat Sentence      85%   [ View Details ]
  Q3  Describe Image       68%   [ View Details ]

Writing
  Q6  Summarise Text       88%   [ View Details ]
  Q7  Write Essay          94%   [ View Details ]

Reading
  Q8  R&W Fill Blanks      75%   [ View Details ]
  ...
````

"View Details" shows full score breakdown + correct answer — identical to individual practice result screen.

---

## Storage

### What Gets Stored

No per-attempt records. No per-question records.

| What | Where | When Updated |
|---|---|---|
| attemptCount | Mock Test Template document | +1 on every submission |
| avgScore | Mock Test Template document | Rolling average on every submission |
| totalMockTests | Student document | +1 on every submission |
| lastActiveAt | Student document | Current timestamp on every submission |
| Question scores | NOT stored | Calculated, shown, discarded |
| Student answers | NOT stored | Scored and discarded immediately |

### Rolling Average Formula
````
newAvg = ((currentAvg × currentCount) + newScore) / (currentCount + 1)

Example:
Template: attemptCount = 20, avgScore = 71
New score: 84
newAvg = ((71 × 20) + 84) / 21 = 71.6
````

---

## Database Schema

### Mock Test Templates Collection (`mock_test_templates`)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| name | String | Template name e.g. "Standard Mock Test" |
| description | String | Short description shown to student |
| totalTime | Integer | Total time in minutes e.g. 90 |
| questionRules | Array | `[{ module, type, count }]` — how many questions per type |
| isActive | Boolean | Controls visibility to students |
| attemptCount | Integer | Incremented per submission |
| avgScore | Float | Rolling average — updated per submission |
| createdAt | Timestamp | Auto-set |

### questionRules Array — Example
```json
"questionRules": [
  { "module": "speaking",  "type": "read_aloud",        "count": 1 },
  { "module": "speaking",  "type": "repeat_sentence",    "count": 1 },
  { "module": "speaking",  "type": "describe_image",     "count": 1 },
  { "module": "writing",   "type": "summarise_written",  "count": 1 },
  { "module": "writing",   "type": "write_essay",        "count": 1 },
  { "module": "reading",   "type": "mcq_single",         "count": 1 },
  { "module": "reading",   "type": "reorder_paragraphs", "count": 1 },
  { "module": "listening", "type": "write_dictation",    "count": 1 },
  { "module": "listening", "type": "mcq_multiple",       "count": 1 }
]
```

---

## API Routes

### Student Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/mock-tests | List all active templates |
| GET | /api/mock-tests/:id | Get one template details |
| POST | /api/mock-tests/:id/start | Generate random question set. Returns full question data. |
| POST | /api/mock-tests/:id/submit | Submit all answers. Score everything. Return result. |

### Admin Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/admin/mock-tests | List all templates with metrics |
| POST | /api/admin/mock-tests | Create new template |
| PUT | /api/admin/mock-tests/:id | Edit template |
| DELETE | /api/admin/mock-tests/:id | Delete template |
| PATCH | /api/admin/mock-tests/:id/status | Toggle active/inactive |

---

## Start Endpoint — How It Works

`POST /api/mock-tests/:id/start`

````
Server:
1. Read questionRules from template
2. For each rule: randomly select 'count' active questions
   of that type from question bank
3. Order: all Speaking first → Writing → Reading → Listening
4. Return full question data array to frontend

Frontend:
- Receives all questions at once
- Manages navigation locally in state
- No server calls between questions
  (except Speaking scoring via Groq)
````

---

## Submit Endpoint — How It Works

`POST /api/mock-tests/:id/submit`

### Request Body
```json
{
  "answers": [
    { "questionId": "abc", "questionType": "read_aloud", "module": "speaking", "score": 72 },
    { "questionId": "def", "questionType": "write_essay", "module": "writing", "answer": "essay text..." },
    { "questionId": "ghi", "questionType": "mcq_single", "module": "reading", "answer": "B" }
  ],
  "timeTaken": 67
}
```

> Note: Speaking answers send pre-scored `score` value (scored during test via Groq). All other modules send the raw `answer` for server-side scoring.

### Server Processing
````
1. Score each answer using existing module scoring functions
2. Calculate module averages (Speaking, Writing, Reading, Listening)
3. Calculate overall score (average of 4 module scores)
4. Update template: attemptCount++, avgScore recalculated
5. Update student: totalMockTests++, lastActiveAt updated
6. Return full result object with scores + correct answers
7. Discard all answers
````

### Response Format
```json
{
  "overallScore": 74,
  "displayScore": "74 / 90",
  "timeTaken": 67,
  "questionsAnswered": 18,
  "modules": {
    "speaking":  { "score": 72, "displayScore": "72 / 90", "questions": [...] },
    "writing":   { "score": 82, "displayScore": "82 / 90", "questions": [...] },
    "reading":   { "score": 75, "displayScore": "75 / 90", "questions": [...] },
    "listening": { "score": 69, "displayScore": "69 / 90", "questions": [...] }
  }
}
```

---

## Edge Cases — How to Handle

| Scenario | How Handled |
|---|---|
| Not enough questions in bank | Use all available for that type. No error thrown. |
| Student refreshes during test | Test state lost. Student starts again. No partial save. |
| Student closes browser mid-test | Attempt abandoned. No record created — nothing was submitted. |
| Overall timer expires mid-Speaking | Recording stops → sent to Groq → once scored, test auto-submits. Unanswered = 0. |
| Overall timer expires mid-Writing | Text auto-submitted → test ends with completed answers scored. |
| Groq slow on Speaking question | Show "Scoring..." message. Wait. If Groq fails → score 0 for that question → advance. |
| Template deleted while student in test | Test completes. Scores shown. Template counters not updated. |

---

## Key Rules — Must Follow While Building

- All questions loaded upfront at start — no mid-test API calls except Speaking scoring.
- All non-Speaking answers submitted in one request at the end.
- Speaking answers pre-scored during test — send score value at submit, not audio.
- Existing scoring functions from all 4 modules reused — zero new scoring code.
- No per-attempt records. Only template counters and student counters updated.
- Student can retake unlimited times — fresh random questions each time.
- Test auto-submits on timer expiry — unanswered questions score 0.
- Module order is fixed: Speaking → Writing → Reading → Listening.
- Overall score = simple average of 4 module scores (equal weight).
- Scores out of 90. `displayScore = finalPercent × 90`.
- No difficulty field on templates — removed from this platform.
