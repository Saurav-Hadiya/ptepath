import EditResourceContent from './EditResourceContent';

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditResourceContent id={id} />;
}
