import { notFound } from 'next/navigation';
import ListeningQuestionForm from '../../ListeningQuestionForm';
import { isValidListeningType } from '../../listening-types';
import type { ListeningQuestionType } from '@/types';

export default async function NewListeningQuestionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidListeningType(type)) notFound();

  return <ListeningQuestionForm mode="create" type={type as ListeningQuestionType} />;
}
