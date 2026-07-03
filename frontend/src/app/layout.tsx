import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import AuthInitializer from '@/components/shared/AuthInitializer';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PTEPath',
  description: 'PTE Exam Practice Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full`}>
      <body className="min-h-full">
        <QueryProvider>
          <AuthInitializer />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
