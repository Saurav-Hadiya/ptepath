import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const STUDENT_PREFIXES = [
  '/dashboard',
  '/settings',
  '/speaking',
  '/writing',
  '/reading',
  '/listening',
  '/mock-tests',
];
const ADMIN_PREFIX = '/admin';
const AUTH_ONLY_PATHS = ['/login', '/forgot-password'];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = request.cookies.has('refreshToken');

  const isStudentRoute = matchesPrefix(pathname, STUDENT_PREFIXES);
  const isAdminRoute = matchesPrefix(pathname, [ADMIN_PREFIX]);
  const isAuthOnlyRoute = AUTH_ONLY_PATHS.includes(pathname);

  if ((isStudentRoute || isAdminRoute) && !hasSessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnlyRoute && hasSessionCookie) {
    // Role is unknown at the edge without decoding the token; land on the
    // student dashboard and let ProtectedRoute bounce admins to theirs —
    // a rare one-hop correction, not a security gap.
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings',
    '/speaking/:path*',
    '/writing/:path*',
    '/reading/:path*',
    '/listening/:path*',
    '/mock-tests/:path*',
    '/admin/:path*',
    '/login',
    '/forgot-password',
  ],
};
