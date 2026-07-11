'use client';

import { useCallback, useMemo } from 'react';
import ReadAloudQuestion from '@/components/speaking/ReadAloudQuestion';
import RepeatSentenceQuestion from '@/components/speaking/RepeatSentenceQuestion';
import DescribeImageQuestion from '@/components/speaking/DescribeImageQuestion';
import RespondSituationQuestion from '@/components/speaking/RespondSituationQuestion';
import AnswerShortQuestion from '@/components/speaking/AnswerShortQuestion';
import type { MockTestQuestion, SpeakingQuestion, SpeakingQuestionType, SpeakingScoreResult } from '@/types';

interface Props {
  question: Extract<MockTestQuestion, { module: 'speaking' }>;
  /** Receives the Groq-scored percentage (0-100) once the recording is scored. */
  onScored: (score: number) => void;
}

// Neutral, procedural copy — a mock test never reveals a score or the correct
// answer per-question, unlike the standalone practice components this wraps.
const COMPLETION_MESSAGE = 'Moving to the next question.';

/**
 * Speaking is the one module scored DURING the mock test (via Groq), so the exact
 * practice components are reused as-is — they record, submit to the real evaluate
 * endpoint, and hand back a score, which we forward up as the stored answer value.
 */
export default function MockSpeakingQuestion({ question, onScored }: Props) {
  const data = question.questionData;

  const speakingQuestion = useMemo<SpeakingQuestion>(
    () => ({
      id: question.id,
      type: question.questionType as SpeakingQuestionType,
      content: data.content ?? '',
      imageUrl: data.imageUrl ?? null,
      speakingTime: question.speakingTime ?? 0,
      preparationTime: question.preparationTime ?? 0,
    }),
    [question, data]
  );

  const handleScoreReceived = useCallback(
    (score: SpeakingScoreResult) => onScored(score.finalScore),
    [onScored]
  );

  switch (question.questionType as SpeakingQuestionType) {
    case 'read_aloud':
      return (
        <ReadAloudQuestion
          question={speakingQuestion}
          onScoreReceived={handleScoreReceived}
          completionMessage={COMPLETION_MESSAGE}
        />
      );
    case 'repeat_sentence':
      return (
        <RepeatSentenceQuestion
          question={speakingQuestion}
          onScoreReceived={handleScoreReceived}
          completionMessage={COMPLETION_MESSAGE}
          revealAnswer={false}
        />
      );
    case 'describe_image':
      return (
        <DescribeImageQuestion
          question={speakingQuestion}
          onScoreReceived={handleScoreReceived}
          completionMessage={COMPLETION_MESSAGE}
        />
      );
    case 'respond_situation':
      return (
        <RespondSituationQuestion
          question={speakingQuestion}
          onScoreReceived={handleScoreReceived}
          completionMessage={COMPLETION_MESSAGE}
        />
      );
    case 'answer_short':
      return (
        <AnswerShortQuestion
          question={speakingQuestion}
          onScoreReceived={handleScoreReceived}
          completionMessage={COMPLETION_MESSAGE}
          revealAnswer={false}
        />
      );
    default:
      return <p className="text-body-md text-text-secondary">Unsupported speaking question type.</p>;
  }
}
