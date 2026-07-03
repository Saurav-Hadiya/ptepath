import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-input bg-border-default/60', className)}
      {...props}
    />
  );
}

export { Skeleton };
