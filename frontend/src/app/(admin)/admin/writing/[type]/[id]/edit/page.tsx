import { notFound } from 'next/navigation';
import EditWritingQuestionContent from './EditWritingQuestionContent';
import { isValidWritingType } from '../../../writing-types';

export default async function WritingEditQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!isValidWritingType(type)) notFound();

  return <EditWritingQuestionContent type={type} id={id} />;
}
