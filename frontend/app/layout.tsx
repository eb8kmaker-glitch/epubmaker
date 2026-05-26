import type { Metadata } from "next";
import Script from "next/script";
import { Lora, DM_Sans, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FeedbackButton from "@/app/components/FeedbackButton";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.epubmaker.org"),
  title: {
    default: "EPUBMaker — Web-based EPUB Creator & Converter",
    template: "%s | EPUBMaker",
  },
  description:
    "Create professional EPUB ebooks online. A simple web-based EPUB maker and converter, designed as an easier alternative to Sigil for ebook creation.",
  keywords: [
    "epub maker",
    "epub converter",
    "ebook creator",
    "online epub editor",
    "sigil alternative",
    "전자책 제작",
    "epub 제작",
    "ebook 변환",
    "free epub creator",
    "web based epub",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lora.variable} ${dmSans.variable} ${dmMono.variable}`}
    >
      <body className="antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
        <FeedbackButton />
        <Script
          src="https://tally.so/widgets/embed.js"
          strategy="afterInteractive"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8254204287118850"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
