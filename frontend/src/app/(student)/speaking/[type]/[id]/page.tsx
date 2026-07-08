import SpeakingAttemptContent from './SpeakingAttemptContent';

export default async function SpeakingQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return <SpeakingAttemptContent key={id} slug={type} id={id} />;
}
