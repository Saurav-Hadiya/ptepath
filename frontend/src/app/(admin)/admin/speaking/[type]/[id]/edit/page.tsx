import { notFound } from 'next/navigation';
import EditSpeakingQuestionContent from './EditSpeakingQuestionContent';
import { isValidSpeakingType } from '../../../speaking-types';

export default async function SpeakingEditQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!isValidSpeakingType(type)) notFound();

  return <EditSpeakingQuestionContent type={type} id={id} />;
}
