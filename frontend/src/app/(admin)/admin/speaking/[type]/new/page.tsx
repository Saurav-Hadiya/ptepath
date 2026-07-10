import { notFound } from 'next/navigation';
import SpeakingQuestionForm from '../../SpeakingQuestionForm';
import { isValidSpeakingType } from '../../speaking-types';

export default async function SpeakingNewQuestionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidSpeakingType(type)) notFound();

  return <SpeakingQuestionForm type={type} mode="create" />;
}
