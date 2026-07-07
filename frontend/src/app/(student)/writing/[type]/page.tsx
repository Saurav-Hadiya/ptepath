import WritingTypeContent from './WritingTypeContent';

export default async function WritingTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <WritingTypeContent slug={type} />;
}
