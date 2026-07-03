import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-body-sm sm:gap-1.5">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-text-muted" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-text-secondary hover:text-action-default">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-text-primary' : 'text-text-secondary'}>
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
