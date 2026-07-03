import Link from 'next/link';
import { ROUTES } from '@/config/routes';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
}

const ICON_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-10',
};

const DOT_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
};

const RING_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
};

const TEXT_SIZE: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-[1rem]',
  md: 'text-[1.15rem]',
  lg: 'text-[1.4rem]',
};

export default function Logo({ size = 'md', variant = 'dark' }: LogoProps) {
  return (
    <Link href={ROUTES.public.landing} className="flex items-center gap-2.5">
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-lg bg-action-default ${ICON_SIZE[size]}`}
      >
        <span className={`rounded-full border-[2.5px] border-white/90 ${RING_SIZE[size]}`} />
        <span
          className={`absolute top-[15%] left-[55%] rounded-full bg-brand-accent ${DOT_SIZE[size]}`}
        />
      </span>
      <span
        className={`font-display font-extrabold tracking-tight ${TEXT_SIZE[size]} ${
          variant === 'light' ? 'text-white' : 'text-brand-primary'
        }`}
      >
        PTE<span className="text-brand-accent">Path</span>
      </span>
    </Link>
  );
}
