import { notFound } from 'next/navigation';
import TypeListContent from './TypeListContent';
import { isValidReadingType } from '../reading-types';

export default async function ReadingTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidReadingType(type)) notFound();

  return <TypeListContent type={type} />;
}
