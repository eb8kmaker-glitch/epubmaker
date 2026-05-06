import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Jost, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FeedbackButton from "@/app/components/FeedbackButton";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${cormorantGaramond.variable} ${jost.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
        <FeedbackButton />
        <Script
          src="https://tally.so/widgets/embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
