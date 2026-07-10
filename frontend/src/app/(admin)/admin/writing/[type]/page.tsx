import { notFound } from 'next/navigation';
import TypeListContent from './TypeListContent';
import { isValidWritingType } from '../writing-types';

export default async function WritingTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidWritingType(type)) notFound();

  return <TypeListContent type={type} />;
}
