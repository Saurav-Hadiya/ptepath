import { notFound } from 'next/navigation';
import ListeningQuestionForm from '../../../ListeningQuestionForm';
import { isValidListeningType } from '../../../listening-types';
import type { ListeningQuestionType } from '@/types';

export default async function EditListeningQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!isValidListeningType(type)) notFound();

  return <ListeningQuestionForm mode="edit" type={type as ListeningQuestionType} questionId={id} />;
}
