import { notFound } from 'next/navigation';
import WritingQuestionForm from '../../WritingQuestionForm';
import { isValidWritingType } from '../../writing-types';

export default async function WritingNewQuestionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidWritingType(type)) notFound();

  return <WritingQuestionForm type={type} mode="create" />;
}
