import { notFound } from 'next/navigation';
import ReadingQuestionForm from '../../../ReadingQuestionForm';
import { isValidReadingType } from '../../../reading-types';
import type { ReadingQuestionType } from '@/types';

export default async function EditReadingQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!isValidReadingType(type)) notFound();

  return <ReadingQuestionForm mode="edit" type={type as ReadingQuestionType} questionId={id} />;
}
