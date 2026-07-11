'use client';

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAdminWritingQuestion } from '@/hooks/queries/useAdminWritingQueries';
import { ROUTES } from '@/config/routes';
import WritingQuestionForm from '../../../WritingQuestionForm';

export default function EditWritingQuestionContent({ type, id }: { type: string; id: string }) {
  const { data: question, isLoading, isError } = useAdminWritingQuestion(id);

  if (isLoading) {
    return (
      <main className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3 rounded-input" />
        <Skeleton className="h-64 rounded-card" />
      </main>
    );
  }

  if (isError || !question) {
    return (
      <main>
        <EmptyState
          icon={FileQuestion}
          title="Question not found"
          description="This question may have been deleted or the link is invalid."
          action={
            <Button nativeButton={false} render={<Link href={ROUTES.admin.writing.type(type)} />}>
              Back to list
            </Button>
          }
        />
      </main>
    );
  }

  return <WritingQuestionForm type={type} mode="edit" existingQuestion={question} />;
}
