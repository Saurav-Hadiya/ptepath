import WritingAttemptContent from './WritingAttemptContent';

export default async function WritingQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return <WritingAttemptContent slug={type} id={id} />;
}
