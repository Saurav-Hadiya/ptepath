import ReadingAttemptContent from './ReadingAttemptContent';

export default async function ReadingQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return <ReadingAttemptContent slug={type} id={id} />;
}
