import ListeningTypeContent from './ListeningTypeContent';

export default async function ListeningTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <ListeningTypeContent slug={type} />;
}
