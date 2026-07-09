import ListeningAttemptContent from './ListeningAttemptContent';

export default async function ListeningQuestionPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  return <ListeningAttemptContent key={id} slug={type} id={id} />;
}
