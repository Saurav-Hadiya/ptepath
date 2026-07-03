import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  label?: string;
}

const SPINNER_SIZE: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'size-4 sm:size-5',
  md: 'size-6 sm:size-8',
  lg: 'size-10 sm:size-12',
};

const LABEL_SIZE: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'text-label-sm',
  md: 'text-body-sm sm:text-body-md',
  lg: 'text-body-md sm:text-body-lg',
};

export default function LoadingSpinner({ size = 'md', fullPage = false, label }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={`animate-spin text-action-default ${SPINNER_SIZE[size]}`} />
      {label && <span className={`text-center text-text-secondary ${LABEL_SIZE[size]}`}>{label}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-bg-card px-4">{spinner}</div>
    );
  }

  return spinner;
}
