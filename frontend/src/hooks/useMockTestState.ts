'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  MockAnswerValue,
  MockTestAnswerPayload,
  MockTestQuestion,
  ModuleType,
} from '@/types';

export interface MockAnswerRecord {
  questionId: string;
  questionType: string;
  module: ModuleType;
  /** Raw answer for non-speaking modules; null for speaking. */
  answer: MockAnswerValue | null;
  /** Pre-scored value for speaking; null otherwise. */
  score: number | null;
}

/**
 * Runtime state for a single mock-test attempt: the loaded question set, the
 * current position, and the per-question answers collected locally (forward-only,
 * no server round-trips between questions except speaking Groq scoring).
 */
export function useMockTestState(questions: MockTestQuestion[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(MockAnswerRecord | null)[]>([]);

  // Reset when a fresh question set is loaded (stable reference from start data).
  useEffect(() => {
    setAnswers(questions.map(() => null));
    setCurrentIndex(0);
  }, [questions]);

  const setAnswer = useCallback(
    (index: number, value: MockAnswerValue | null) => {
      setAnswers((prev) => {
        const question = questions[index];
        if (!question) return prev;
        const next = [...prev];
        next[index] =
          value == null
            ? null
            : {
                questionId: question.id,
                questionType: question.questionType,
                module: question.module,
                answer: value,
                score: null,
              };
        return next;
      });
    },
    [questions]
  );

  const setSpeakingScore = useCallback(
    (index: number, score: number) => {
      setAnswers((prev) => {
        const question = questions[index];
        if (!question) return prev;
        const next = [...prev];
        next[index] = {
          questionId: question.id,
          questionType: question.questionType,
          module: question.module,
          answer: null,
          score,
        };
        return next;
      });
    },
    [questions]
  );

  const nextQuestion = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, Math.max(0, questions.length - 1)));
  }, [questions.length]);

  const skipQuestion = useCallback(
    (index: number) => {
      // Explicit skip discards any partial answer for this question (scores 0).
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      nextQuestion();
    },
    [nextQuestion]
  );

  /** Builds the exact payload the submit endpoint expects for every question. */
  const buildAnswersPayload = useCallback((): MockTestAnswerPayload[] => {
    return questions.map((question, i) => {
      const record = answers[i];
      const isSpeaking = question.module === 'speaking';
      return {
        questionId: question.id,
        questionType: question.questionType,
        module: question.module,
        answer: isSpeaking ? null : record?.answer ?? null,
        score: isSpeaking ? record?.score ?? null : null,
      };
    });
  }, [questions, answers]);

  const answeredCount = answers.filter((a) => a != null).length;
  const currentQuestion = questions[currentIndex] ?? null;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isCurrentAnswered = answers[currentIndex] != null;

  return {
    currentIndex,
    answers,
    answeredCount,
    currentQuestion,
    isLastQuestion,
    isCurrentAnswered,
    setAnswer,
    setSpeakingScore,
    nextQuestion,
    skipQuestion,
    buildAnswersPayload,
  };
}
