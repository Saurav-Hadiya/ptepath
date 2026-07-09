import MockTestConfirmContent from './MockTestConfirmContent';

export default async function MockTestConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MockTestConfirmContent templateId={id} />;
}
