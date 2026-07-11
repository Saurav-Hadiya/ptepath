import MockTestForm from '../../MockTestForm';

export default async function EditMockTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MockTestForm mode="edit" templateId={id} />;
}
