import { notFound } from 'next/navigation';
import TypeListContent from './TypeListContent';
import { isValidListeningType } from '../listening-types';

export default async function ListeningTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isValidListeningType(type)) notFound();

  return <TypeListContent type={type} />;
}
