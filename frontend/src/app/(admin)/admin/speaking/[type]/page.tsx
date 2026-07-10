import { notFound } from 'next/navigation';
import TypeListContent from './TypeListContent';
import { isValidSpeakingType } from '../speaking-types';

export default async function SpeakingTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidSpeakingType(type)) notFound();

  return <TypeListContent type={type} />;
}
