'use client';

import MockSpeakingQuestion from '@/components/mock-test/MockSpeakingQuestion';
import MockWritingQuestion from '@/components/mock-test/MockWritingQuestion';
import MockReadingQuestion from '@/components/mock-test/MockReadingQuestion';
import MockListeningQuestion from '@/components/mock-test/MockListeningQuestion';
import type { MockAnswerValue, MockTestQuestion } from '@/types';

interface Props {
  question: MockTestQuestion;
  /** Non-speaking modules report their current answer (null when unanswered). */
  onAnswerChange: (answer: MockAnswerValue | null) => void;
  /** Speaking reports its Groq score once scored during the test. */
  onSpeakingScored: (score: number) => void;
  /** Writing's per-question timer expiry auto-advances the test. */
  onWritingTimeExpired: () => void;
}

export default function MockTestQuestionRenderer({
  question,
  onAnswerChange,
  onSpeakingScored,
  onWritingTimeExpired,
}: Props) {
  switch (question.module) {
    case 'speaking':
      return <MockSpeakingQuestion question={question} onScored={onSpeakingScored} />;
    case 'writing':
      return (
        <MockWritingQuestion
          question={question}
          onAnswerChange={onAnswerChange}
          onTimeExpired={onWritingTimeExpired}
        />
      );
    case 'reading':
      return <MockReadingQuestion question={question} onAnswerChange={onAnswerChange} />;
    case 'listening':
      return <MockListeningQuestion question={question} onAnswerChange={onAnswerChange} />;
    default:
      return null;
  }
}
