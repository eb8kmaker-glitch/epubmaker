import type { Metadata } from "next";
import ConversionLanding, { type ConversionLandingData } from "@/app/components/content/ConversionLanding";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

type Props = { params: Promise<{ locale: string }> };

const BASE_URL = "https://www.epubmaker.org";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  // Confirmed English copy is used for every locale for now.
  // TODO: translate (ko) — Korean metadata is a separate translation queue task.
  const title = "Convert TXT to EPUB Online Free — Chapters & Table of Contents | epubmaker";
  const description =
    "Turn a plain TXT file into a clean EPUB ebook, free — no account, no limits, no watermark. Split chapters, build a table of contents, and set the cover and metadata before you export for Kobo, Apple Books, or Calibre.";
  const url = `${BASE_URL}/${locale}/txt-to-epub`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/txt-to-epub`,
        ko: `${BASE_URL}/ko/txt-to-epub`,
      },
    },
    openGraph: { title, description, url, type: "website", locale },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TxtToEpubPage({ params }: Props) {
  await params;

  // Confirmed English copy is used for every locale for now.
  // TODO: translate (ko) — Korean copy is a separate translation queue task.
  const data: ConversionLandingData = {
    eyebrow: "Free EPUB Conversion · TXT → EPUB",
    h1: "Convert TXT to EPUB — with chapters and a table of contents",
    subhead:
      "No account, no limits, no watermark. Turn a plain text file into a structured EPUB: split it into chapters, generate a table of contents, and add a cover.",
    ctaLabel: "Convert TXT to EPUB — Free",
    stepsHeading: "How to convert TXT to EPUB",
    howToName: "How to Convert TXT to EPUB",
    steps: [
      "Open the converter and choose your TXT file. No account or sign-up required.",
      "Split the text into chapters and generate a table of contents.",
      "Add a cover, set the title and author, then export your EPUB.",
    ],
    faqHeading: "Frequently asked questions",
    faq: [
      {
        q: "Is it free?",
        a: "Yes. It is completely free — no sign-up, no watermark, and no file-size paywall.",
      },
      {
        q: "Is my file kept after conversion?",
        a: "No. Your file is processed on the server only to run the conversion and is not stored or shared. You can also delete it from your browser after downloading.",
      },
      {
        q: "Can I edit the file before exporting?",
        a: "Yes. You can replace the cover, adjust chapter breaks, build the table of contents, and edit the title and author.",
      },
      {
        q: "How are chapters created from plain text?",
        a: "You can split the text into chapters using markers or headings, and a table of contents is generated from them.",
      },
      {
        q: "Which readers does the EPUB work on?",
        a: "EPUB works on Apple Books, Kobo, Google Play Books, Calibre, and Adobe Digital Editions. For Kindle, send the EPUB to your device through Amazon.",
      },
    ],
    relatedHeading: "Related",
    related: [
      { href: "/doc-to-epub", label: "Convert DOC to EPUB" },
      { href: "/convert", label: "Open the EPUB converter" },
    ],
    finalCtaText: "Ready to turn your text file into an EPUB?",
  };

  return <ConversionLanding data={data} />;
}
