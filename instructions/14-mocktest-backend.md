# 14 — Mock Test Backend - OLD

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/14-mocktest-backend.md and implement exactly what is described."

---

## What to Build
Complete mock test backend including:
- Template schema and CRUD for admin
- Random question generation from template rules
- Submit endpoint that scores all answers and returns full result
- Reuse of all existing module scoring functions

---

## Reference Docs
- `docs/md/mocktest-blueprint.md` — complete mock test logic, flows, DB schema, API routes
- `instructions/06-project-structure.md` — file locations

---

## Prerequisites
- All previous backend files complete (07 through 13)
- All 4 module scoring functions working
- All 4 question models working
- authenticate and authorize middleware working

---

## Files to Implement

### 1. `src/models/mocktest-template.model.ts`

Mongoose schema with these exact fields:

| Field | Type | Details |
|---|---|---|
| name | String | required, trim |
| description | String | required, trim |
| totalTime | Number | required — total time in minutes |
| questionRules | Array | required — see structure below |
| isActive | Boolean | default: true |
| createdAt | Date | default: Date.now |
| attemptCount | Number | default: 0 |
| avgScore | Number | default: 0 |

**questionRules array item structure:**
````
{
  module: String  — required, enum: ['speaking', 'writing', 'reading', 'listening']
  type: String    — required (question type within that module)
  count: Number   — required, min: 1
}
````

Export as `MockTestTemplate` model.

---

### 2. `src/controllers/mocktest.controller.ts`

---

**Admin Controllers:**

`createTemplate` — POST /api/admin/mock-tests
````
1. Get name + description + totalTime + questionRules from req.body
2. Validate:
   - name: required, non-empty
   - description: required, non-empty
   - totalTime: required, number, min 10 minutes
   - questionRules: required, array, min 1 item
   - Each rule must have: module, type, count
   - count must be >= 1
3. Create and save MockTestTemplate document
4. Return 201 { success: true, data: { template } }
````

`getAllTemplates` — GET /api/admin/mock-tests
````
1. Find all templates, sort createdAt desc
2. Return 200 { success: true, data: { templates, total } }
````

`getOneTemplate` — GET /api/admin/mock-tests/:id
````
1. Find template by id
2. If not found → 404
3. Return 200 { success: true, data: { template } }
````

`updateTemplate` — PUT /api/admin/mock-tests/:id
````
1. Find template by id
2. If not found → 404
3. Update allowed fields: name, description, totalTime, questionRules
4. Save and return updated template
````

`deleteTemplate` — DELETE /api/admin/mock-tests/:id
````
1. Find template by id
2. If not found → 404
3. Delete document
4. Return 200 { success: true, message: 'Template deleted.' }
````

`toggleStatus` — PATCH /api/admin/mock-tests/:id/status
````
1. Find template by id
2. Set isActive to provided boolean
3. Save and return 200
````

---

**Student Controllers:**

`getActiveTemplates` — GET /api/mock-tests
````
1. Find all templates where isActive = true
2. Sort by createdAt desc
3. Return safe fields only:
   id, name, description, totalTime, questionRules
   (no attemptCount or avgScore exposed to students)
4. Return 200 { success: true, data: { templates } }
````

---

`startMockTest` — POST /api/mock-tests/:id/start
````
This is the most important endpoint.
It generates the full random question set for the student.

1. Find template by id where isActive = true
2. If not found → 404

3. For each rule in template.questionRules:
   a. Determine which model to query based on rule.module:
      'speaking'  → SpeakingQuestion model
      'writing'   → WritingQuestion model
      'reading'   → ReadingQuestion model
      'listening' → ListeningQuestion model

   b. Find ALL active questions of rule.type from that model
   c. If available questions < rule.count:
      Use all available (do not throw error)
   d. If no questions available for a type:
      Skip that type (do not throw error)
   e. Randomly select rule.count questions from available pool:
      Shuffle array, take first rule.count items

4. Order selected questions by module:
   All speaking questions first
   Then all writing questions
   Then all reading questions
   Then all listening questions

5. Strip correct answers before sending:
   Speaking: remove acceptedAnswers from answer_short
   Reading: remove isCorrect from options, remove correctAnswer from blanks,
            shuffle reorder_paragraphs paragraphs
   Listening: remove isCorrect from options, remove correctWord from blanks,
              remove incorrectWordIndices, remove correctSentence

6. Return 200 {
     success: true,
     data: {
       templateId: id,
       templateName: name,
       totalTime: totalTime (in minutes),
       totalQuestions: questions.length,
       questions: [
         {
           id: questionId,
           module: 'speaking' | 'writing' | 'reading' | 'listening',
           questionType: type,
           questionData: { ...safe question fields },
           speakingTime: number | null,
           preparationTime: number | null
         }
       ]
     }
   }
````

---

`submitMockTest` — POST /api/mock-tests/:id/submit
````
This scores everything and returns full results.

1. Find template by id (can be inactive — student may have started before deactivation)
2. If not found → 404
3. Get answers array + timeTaken from req.body

answers array format:
[
  {
    questionId: string,
    questionType: string,
    module: 'speaking' | 'writing' | 'reading' | 'listening',
    answer: any,           — raw answer for non-speaking questions
    score: number | null   — pre-scored value for speaking questions only
  }
]

4. Score each answer:

For SPEAKING questions:
  If answer.score is provided (pre-scored via Groq during test):
    Use answer.score directly as finalScore
  If answer.score is null (student skipped or time expired):
    finalScore = 0

For WRITING questions:
  Call scoreWriting(answer.answer, answer.questionType)
  Extract finalScore

For READING questions:
  Find question from DB by questionId
  Call calculateReadingScore(answer.questionType, answer.answer, question)
  Extract finalScore

For LISTENING questions:
  Find question from DB by questionId (need correctSentence, options etc)
  Call calculateListeningScore(answer.questionType, answer.answer, question)
  Extract finalScore

5. Group scores by module:
   speakingScores = all speaking question finalScores
   writingScores = all writing question finalScores
   readingScores = all reading question finalScores
   listeningScores = all listening question finalScores

6. Calculate module averages:
   speakingAvg = sum(speakingScores) / speakingScores.length
   (if no speaking questions → 0)
   Same for writing, reading, listening

7. Calculate overall score:
   Count modules that have at least 1 question
   overallScore = sum of module averages / modulesWithQuestions count

8. Update template stats (only if template still exists):
   template.attemptCount += 1
   template.avgScore = rolling average with overallScore
   await template.save()

9. Update student stats:
   await User.findByIdAndUpdate(req.user.userId, {
     $inc: { totalAttempts: totalAnswers, totalMockTests: 1 },
     lastActiveAt: new Date()
   })

10. Build detailed result for each question:
    Fetch DB question for reading + listening to get correct answers
    Include score breakdown and correct answer per question

11. Return 200:
{
  success: true,
  data: {
    overallScore: number,
    displayScore: string,           — e.g. "74 / 90"
    timeTaken: number,              — minutes
    questionsAnswered: number,
    modules: {
      speaking: {
        score: number,
        displayScore: string,
        questions: [{ questionId, questionType, score, displayScore, breakdown }]
      },
      writing: { ... },
      reading: { ... },
      listening: { ... }
    }
  }
}
````

---

### 3. `src/routes/mocktest.routes.ts`

**Admin routes** — require authenticate + authorize('admin'):
````
POST   /api/admin/mock-tests                    → createTemplate
GET    /api/admin/mock-tests                    → getAllTemplates
GET    /api/admin/mock-tests/:id                → getOneTemplate
PUT    /api/admin/mock-tests/:id                → updateTemplate
DELETE /api/admin/mock-tests/:id                → deleteTemplate
PATCH  /api/admin/mock-tests/:id/status         → toggleStatus
````

**Student routes** — require authenticate:
````
GET    /api/mock-tests                          → getActiveTemplates
POST   /api/mock-tests/:id/start               → startMockTest
POST   /api/mock-tests/:id/submit              → submitMockTest
````

---

## Random Question Selection — Helper Function

Create a private helper inside controller file:

```typescript
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function selectRandom<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, count)
}
```

---

## Module Score Display Format

````
overallScore: 74.15
displayScore: "67 / 90"  — Math.round(74.15 × 0.90)

Per module:
speakingScore: 79.8
speakingDisplay: "72 / 90"  — Math.round(79.8 × 0.90)
````

---

## Edge Cases to Handle

| Scenario | How to Handle |
|---|---|
| Not enough questions in bank for a rule | Use all available. Do not throw error. |
| No questions at all for a type | Skip that type. Do not throw error. |
| Speaking answer has null score | Score = 0 for that question |
| Template deleted after student started | Score normally. Template stats update skipped if not found. |
| Student submits empty answers array | All scores = 0. Still process and return result. |
| Module has 0 questions answered | Module score = 0. Count module in overall average only if at least 1 answer provided. |
| timeTaken not provided | Default to template.totalTime |

---

## Important Notes on Speaking Answers in Submit

Speaking questions are scored DURING the mock test in the frontend
via the Groq STT adapter. By the time submit is called:
- Speaking answers contain a pre-calculated `score` value
- The actual audio has already been discarded
- Backend uses this pre-calculated score directly
- No Groq calls happen during submitMockTest

This is the key difference from individual practice:
````
Individual practice:  audio → backend → Groq → score → response
Mock test speaking:   audio → Groq (during test) → score stored in frontend state
                      → on submit: score value sent to backend (no audio)
````

---

## Request Format for Submit

```json
{
  "timeTaken": 67,
  "answers": [
    {
      "questionId": "abc123",
      "questionType": "read_aloud",
      "module": "speaking",
      "answer": null,
      "score": 72.4
    },
    {
      "questionId": "def456",
      "questionType": "write_essay",
      "module": "writing",
      "answer": "The essay text goes here...",
      "score": null
    },
    {
      "questionId": "ghi789",
      "questionType": "mcq_single",
      "module": "reading",
      "answer": "B",
      "score": null
    },
    {
      "questionId": "jkl012",
      "questionType": "write_dictation",
      "module": "listening",
      "answer": "The scientists discovered a new species",
      "score": null
    }
  ]
}
```

---

## Expected Output When Done
- Admin can create/edit/delete/toggle mock test templates
- Students can see active templates
- Start endpoint returns random questions with correct answers hidden
- Submit endpoint scores all answers using existing module functions
- Speaking pre-scored values used directly
- Module averages and overall score calculated correctly
- Template and student stats updated
- Full result returned with per-question breakdown

---

## Verification Steps
1. POST /api/admin/mock-tests → template created with questionRules
2. GET /api/mock-tests → only active templates returned
3. POST /api/mock-tests/:id/start → returns questions, correct answers hidden
4. POST /api/mock-tests/:id/start (again) → different random questions returned
5. POST /api/mock-tests/:id/submit → scores calculated, result returned
6. Check result: speaking score uses provided value, others calculated server-side
7. Check MongoDB → template.attemptCount incremented, avgScore updated
8. Check MongoDB → student.totalMockTests incremented
9. POST /api/mock-tests/:id/start with empty question bank → returns empty array gracefully

---

## Notes
- No new scoring functions — all reused from modules 09-13
- Speaking scores pre-calculated during test — sent as values not audio
- No per-attempt records stored — only template and student counters
- Question bank queried fresh on every start — guarantees random variety
- Module order fixed in response: speaking → writing → reading → listening
- Overall score = average of module averages (equal weight)
- displayScore = Math.round(score × 0.90) + ' / 90' — consistent across platform
- No difficulty field anywhere — removed from this platform

## Next Step
→ Give Claude Code `15-backend-deploy-render.md`
