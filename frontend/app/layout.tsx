import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import LoginButton from "./components/LoginButton";
import SessionProvider from "./components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOCX to EPUB Converter",
  description: "Convert DOCX and TXT to EPUB instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <Link
                href="/"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
              >
                EPUB Converter
              </Link>
              <LoginButton />
            </div>
          </header>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
