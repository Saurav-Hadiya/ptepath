import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/config/routes';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

const ICON_SIZE: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 28,
  md: 34,
  lg: 42,
};

const TEXT_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-[1rem]',
  md: 'text-[1.15rem]',
  lg: 'text-[1.4rem]',
};

export default function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  const iconSize = ICON_SIZE[size];

  return (
    <Link href={ROUTES.public.landing} className="flex items-center gap-2.5">
      <span
        className={`inline-flex shrink-0 overflow-hidden rounded-lg ring-1 ${
          variant === 'light' ? 'ring-primary-foreground/15' : 'ring-border-default'
        }`}
        style={{ width: iconSize, height: iconSize }}
      >
        <Image
          src="/images/ptepath-icon.svg"
          alt="PTEPath icon"
          width={iconSize}
          height={iconSize}
          priority
          unoptimized
        />
      </span>
      <span
        className={`font-display font-extrabold tracking-tight ${TEXT_SIZE[size]} ${
          variant === 'light' ? 'text-primary-foreground' : 'text-brand-primary'
        }`}
      >
        PTE<span className="text-brand-accent">Path</span>
      </span>
    </Link>
  );
}
