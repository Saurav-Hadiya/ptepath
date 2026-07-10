import { Music } from 'lucide-react';

interface QuestionPreviewProps {
  content: string | null | undefined;
  maxLength?: number;
}

export default function QuestionPreview({ content, maxLength = 80 }: QuestionPreviewProps) {
  if (!content) {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-text-muted">
        <Music className="size-3.5" />
        Audio question
      </span>
    );
  }

  const truncated = content.length > maxLength ? `${content.slice(0, maxLength)}...` : content;

  return (
    <span className="text-body-sm text-text-primary" title={content}>
      {truncated}
    </span>
  );
}
