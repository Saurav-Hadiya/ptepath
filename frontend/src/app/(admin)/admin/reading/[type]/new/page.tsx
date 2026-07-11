import { notFound } from 'next/navigation';
import ReadingQuestionForm from '../../ReadingQuestionForm';
import { isValidReadingType } from '../../reading-types';
import type { ReadingQuestionType } from '@/types';

export default async function NewReadingQuestionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidReadingType(type)) notFound();

  return <ReadingQuestionForm mode="create" type={type as ReadingQuestionType} />;
}
