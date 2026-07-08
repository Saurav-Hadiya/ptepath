import SpeakingTypeContent from './SpeakingTypeContent';

export default async function SpeakingTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  return <SpeakingTypeContent slug={type} />;
}
