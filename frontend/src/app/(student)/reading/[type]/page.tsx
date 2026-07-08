import ReadingTypeContent from './ReadingTypeContent';

export default async function ReadingTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <ReadingTypeContent slug={type} />;
}
