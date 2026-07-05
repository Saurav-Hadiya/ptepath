import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PTEPath",
  description: "PTE Exam Practice Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
