# 12 — Reading Backend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/12-reading-backend.md and implement exactly what is described."

---

## What to Build
Complete reading module backend including:
- Question schema and CRUD for admin
- Scoring logic for all 5 question types
- Single evaluate endpoint routing to correct scoring function

---

## Reference Docs
- `docs/md/reading-module.md` — complete scoring logic, DB schema, API routes
- `instructions/06-project-structure.md` — file locations

---

## Prerequisites
- `07-authentication-backend.md` complete
- authenticate and authorize middleware working

---

## Files to Implement

### 1. `src/models/reading-question.model.ts`

Mongoose schema with these exact fields:

| Field | Type | Details |
|---|---|---|
| type | String | required, enum: ['rw_fill_blanks', 'mcq_multiple', 'reorder_paragraphs', 'reading_fill_blanks', 'mcq_single'] |
| passage | String | required — reading passage text |
| question | String | default: null — question text for MCQ types only |
| blanks | Array | for fill-blank types: `[{ position: Number, correctAnswer: String, options: [String] }]` |
| options | Array | for MCQ types: `[{ label: String, text: String, isCorrect: Boolean }]` |
| paragraphs | Array | for reorder type: `[{ label: String, text: String }]` in correct order |
| wordPool | Array | for rw_fill_blanks only: `[String]` — all words including distractors |
| isActive | Boolean | default: true |
| createdAt | Date | default: Date.now |
| attemptCount | Number | default: 0 |
| avgScore | Number | default: 0 |

Export as `ReadingQuestion` model.

---

### 2. `src/scoring/reading.scoring.ts`

Implement all scoring functions.
Read `docs/md/reading-module.md` for complete scoring logic.

---

**`scoreFillBlanks(studentAnswers, correctAnswers)`**

Used by both rw_fill_blanks and reading_fill_blanks types.

````
studentAnswers = string array (one per blank)
correctAnswers = string array (one per blank, from DB)

For each blank (index i):
  Compare studentAnswers[i].toLowerCase().trim()
  with correctAnswers[i].toLowerCase().trim()
  Exact match → 1 point
  No match    → 0 points

score = (correctCount / totalBlanks) × 100

Return:
{
  score: number
  correctCount: number
  totalBlanks: number
  breakdown: Array<{
    blank: number
    studentAnswer: string
    correctAnswer: string
    correct: boolean
  }>
}
````

---

**`scoreMCQMultiple(studentAnswers, options)`**

````
studentAnswers = string array of selected option labels e.g. ['A', 'C']
options = array from DB: [{ label, text, isCorrect }]

correctOptions = options.filter(o => o.isCorrect)
numberOfCorrect = correctOptions.length

For each option:
  If label in studentAnswers AND isCorrect → points +1
  If label in studentAnswers AND NOT isCorrect → points -1
  If label NOT in studentAnswers → points 0

totalPoints = sum of all points
score = max(0, totalPoints) / numberOfCorrect × 100

Return:
{
  score: number
  totalPoints: number
  numberOfCorrect: number
  optionResults: Array<{
    label: string
    text: string
    selected: boolean
    isCorrect: boolean
    result: 'correct_selected' | 'wrong_selected' | 'missed' | 'neutral'
  }>
}
````

Result classification:
- selected + correct → 'correct_selected'
- selected + wrong → 'wrong_selected'
- not selected + correct → 'missed'
- not selected + wrong → 'neutral'

---

**`scoreReorderParagraphs(studentSequence, correctSequence)`**

````
studentSequence = string array of paragraph labels e.g. ['C', 'A', 'B', 'D']
correctSequence = string array from DB e.g. ['A', 'B', 'C', 'D']

n = correctSequence.length
totalPairs = n × (n - 1) / 2

Generate all correct pairs from correctSequence:
For i = 0 to n-1:
  For j = i+1 to n-1:
    pair = (correctSequence[i], correctSequence[j])
    — left item must appear before right item

For each correct pair:
  Find position of left item in studentSequence
  Find position of right item in studentSequence
  If leftPos < rightPos → correctPairs +1

score = correctPairs / totalPairs × 100

Return:
{
  score: number
  correctPairs: number
  totalPairs: number
  studentSequence: string[]
  correctSequence: string[]
}
````

---

**`scoreMCQSingle(studentAnswer, options)`**

````
studentAnswer = string — label of selected option e.g. 'B'
options = array from DB: [{ label, text, isCorrect }]

correctOption = options.find(o => o.isCorrect)
isCorrect = studentAnswer === correctOption.label
score = isCorrect ? 100 : 0

Return:
{
  score: number
  isCorrect: boolean
  studentAnswer: string
  correctAnswer: string
  correctAnswerText: string
  optionResults: Array<{
    label: string
    text: string
    selected: boolean
    isCorrect: boolean
  }>
}
````

---

**`calculateReadingScore(questionType, studentAnswer, question)`**

Single entry point that routes to correct scoring function:
````
switch questionType:
  'rw_fill_blanks':
    correctAnswers = question.blanks.map(b => b.correctAnswer)
    return scoreFillBlanks(studentAnswer, correctAnswers)

  'mcq_multiple':
    return scoreMCQMultiple(studentAnswer, question.options)

  'reorder_paragraphs':
    correctSequence = question.paragraphs.map(p => p.label)
    return scoreReorderParagraphs(studentAnswer, correctSequence)

  'reading_fill_blanks':
    correctAnswers = question.blanks.map(b => b.correctAnswer)
    return scoreFillBlanks(studentAnswer, correctAnswers)

  'mcq_single':
    return scoreMCQSingle(studentAnswer, question.options)
````

Each scoring result also gets:
````
finalScore = score (already 0-100)
displayScore = Math.round(score × 0.90) + ' / 90'
feedback = generateReadingFeedback(score, questionType)
````

---

**`generateReadingFeedback(score, questionType)`**

````
score >= 80 → 'Excellent! Strong reading comprehension.'
score 60-79 → 'Good attempt. Review the incorrect answers carefully.'
score 40-59 → 'Keep practising. Read the passage more carefully before answering.'
score < 40  → 'Needs improvement. Take time to read the full passage.'
````

---

### 3. `src/controllers/reading.controller.ts`

---

**Admin Controllers:**

`addQuestion` — POST /api/admin/reading/questions
````
1. Get type + passage + question + blanks + options
   + paragraphs + wordPool from req.body
2. Validate required fields per type:
   - All types: type + passage required
   - rw_fill_blanks: wordPool required, blanks required
     each blank must have: position, correctAnswer, options[]
   - mcq_multiple: question required, options[] required
     at least 2 options, at least 1 marked isCorrect
   - reorder_paragraphs: paragraphs[] required, min 3 items
     each paragraph must have label and text
   - reading_fill_blanks: blanks required
     each blank must have: position, correctAnswer, options[]
   - mcq_single: question required, options[] required
     exactly 1 option marked isCorrect
3. Create and save ReadingQuestion document
4. Return 201 { success: true, data: { question } }
````

`getAllQuestions` — GET /api/admin/reading/questions
````
1. Get type from query params (optional filter)
2. Find questions matching filter, sort createdAt desc
3. Return 200 { success: true, data: { questions, total } }
````

`getOneQuestion` — GET /api/admin/reading/questions/:id
````
1. Find question by id
2. If not found → 404
3. Return full question including all nested data
````

`updateQuestion` — PUT /api/admin/reading/questions/:id
````
1. Find question by id
2. If not found → 404
3. Update allowed fields: passage, question, blanks,
   options, paragraphs, wordPool
4. Do not allow changing type
5. Save and return updated question
````

`deleteQuestion` — DELETE /api/admin/reading/questions/:id
````
1. Find question by id
2. If not found → 404
3. Delete document
4. Return 200 { success: true, message: 'Question deleted.' }
````

`toggleStatus` — PATCH /api/admin/reading/questions/:id/status
````
1. Find question by id
2. Set isActive to provided boolean
3. Save and return 200
````

---

**Student Controllers:**

`getQuestion` — GET /api/reading/:type/:id
````
1. Validate type is valid enum
2. Find active question by id and type
3. If not found → 404
4. Return question data
   IMPORTANT — strip isCorrect from options and blanks:
   - For MCQ types: return options without isCorrect field
   - For fill_blanks: return blanks without correctAnswer
   - For reorder: shuffle paragraphs array before sending
     (do not send in correct order)
   - correctAnswer only revealed after submission
````

`getRandomQuestion` — GET /api/reading/:type/random
````
1. Find all active questions of given type
2. Pick one randomly
3. Return same shape as getQuestion (strip correct answers)
````

`evaluate` — POST /api/reading/evaluate
````
1. Get questionId + questionType + answers from req.body
2. Validate all required
3. Find question by id and type
4. If not found → 404
5. Call calculateReadingScore(questionType, answers, question)
6. Update question stats (attemptCount + avgScore)
7. Update student stats (totalAttempts + lastActiveAt)
8. Return 200 with full score result including correct answers
   (correct answers NOW revealed in response)
````

---

**Rolling Average Update:**
````
question.attemptCount += 1
question.avgScore = ((question.avgScore × (question.attemptCount - 1)) + finalScore) / question.attemptCount
await question.save()
````

**Student Stats Update:**
````
await User.findByIdAndUpdate(req.user.userId, {
  $inc: { totalAttempts: 1 },
  lastActiveAt: new Date()
})
````

---

### 4. `src/routes/reading.routes.ts`

**Admin routes** — require authenticate + authorize('admin'):
````
POST   /api/admin/reading/questions             → addQuestion
GET    /api/admin/reading/questions             → getAllQuestions
GET    /api/admin/reading/questions/:id         → getOneQuestion
PUT    /api/admin/reading/questions/:id         → updateQuestion
DELETE /api/admin/reading/questions/:id         → deleteQuestion
PATCH  /api/admin/reading/questions/:id/status  → toggleStatus
````

**Student routes** — require authenticate:
````
GET    /api/reading/:type/:id                   → getQuestion
GET    /api/reading/:type/random                → getRandomQuestion
POST   /api/reading/evaluate                    → evaluate
````

---

## Evaluate Request Format

```json
{
  "questionId": "abc123",
  "questionType": "mcq_multiple",
  "answers": ["A", "C"]
}
```

`answers` format per question type:
| Type | answers format |
|---|---|
| rw_fill_blanks | `["word1", "word2", "word3"]` — one per blank in order |
| mcq_multiple | `["A", "C"]` — selected option labels |
| reorder_paragraphs | `["C", "A", "B", "D"]` — student's sequence |
| reading_fill_blanks | `["word1", "word2"]` — one per blank in order |
| mcq_single | `"B"` — single selected label (string not array) |

---

## Score Response Format

```json
{
  "success": true,
  "data": {
    "questionType": "mcq_multiple",
    "finalScore": 33.3,
    "displayScore": "30 / 90",
    "feedback": "Good attempt. Review the incorrect answers carefully.",
    "breakdown": {
      "score": 33.3,
      "totalPoints": 1,
      "numberOfCorrect": 3,
      "optionResults": [
        { "label": "A", "text": "...", "selected": true, "isCorrect": true, "result": "correct_selected" },
        { "label": "B", "text": "...", "selected": true, "isCorrect": false, "result": "wrong_selected" },
        { "label": "C", "text": "...", "selected": false, "isCorrect": true, "result": "missed" }
      ]
    }
  }
}
```

---

## Critical Rule — Correct Answers Hidden Before Submission

When student fetches a question:
- MCQ options: send label and text only — NO isCorrect field
- Fill blanks: send position and options only — NO correctAnswer field
- Reorder: shuffle paragraphs — do not send in correct order
- Word pool for rw_fill_blanks: send as-is (shuffled is fine)

When student submits and gets score response:
- All correct answers revealed in breakdown
- isCorrect field included in options
- correctAnswer included in blanks breakdown
- correctSequence included in reorder breakdown

---

## Expected Output When Done
- Admin can create all 5 question types with correct validation
- Students fetch questions without seeing correct answers
- Single evaluate endpoint routes to correct scoring function
- All 5 scoring functions return correct results
- Pair-based scoring works correctly for reorder type
- Negative marking works correctly for MCQ multiple
- Question and student stats updated on every submission

---

## Verification Steps
1. POST /api/admin/reading/questions (mcq_single) → created correctly
2. GET /api/reading/mcq_single/:id → options returned without isCorrect
3. POST /api/reading/evaluate (mcq_single, correct answer) → score 100%, displayScore "90 / 90"
4. POST /api/reading/evaluate (mcq_single, wrong answer) → score 0%, displayScore "0 / 90"
5. POST /api/reading/evaluate (mcq_multiple) → negative marking works, score cannot go below 0
6. POST /api/reading/evaluate (reorder_paragraphs, perfect order) → score 100%
7. POST /api/reading/evaluate (reorder_paragraphs, one wrong) → partial score via pair-based
8. Check MongoDB → stats updated correctly

---

## Notes
- scoreFillBlanks() shared by both rw_fill_blanks and reading_fill_blanks
- Single POST /api/reading/evaluate handles all 5 types via questionType field
- Correct answers never sent in GET question response — only in POST evaluate response
- Reorder paragraphs shuffled before sending to student
- MCQ multiple: score cannot go below 0 — cap with Math.max(0, total)
- No difficulty field anywhere — removed from this platform

## Next Step
→ Give Claude Code `13-listening-backend.md`
