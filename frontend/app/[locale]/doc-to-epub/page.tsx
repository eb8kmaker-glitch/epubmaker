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
  const title = "Convert DOC to EPUB Online Free — Edit Before Export | epubmaker";
  const description =
    "Convert Word DOCX to EPUB free — no account, no limits, no watermark. Edit the cover, chapters, and metadata before you export. Ready for Kobo, Apple Books, and Calibre.";
  const url = `${BASE_URL}/${locale}/doc-to-epub`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/doc-to-epub`,
        ko: `${BASE_URL}/ko/doc-to-epub`,
      },
    },
    openGraph: { title, description, url, type: "website", locale },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DocToEpubPage({ params }: Props) {
  await params;

  // Confirmed English copy is used for every locale for now.
  // TODO: translate (ko) — Korean copy is a separate translation queue task.
  const data: ConversionLandingData = {
    eyebrow: "Free EPUB Conversion · DOC → EPUB",
    h1: "Convert DOC to EPUB — free, right in your browser",
    subhead:
      "No account, no limits, no watermark. Convert your Word document and fine-tune the cover, chapters, and metadata before exporting a clean EPUB.",
    ctaLabel: "Convert DOC to EPUB — Free",
    stepsHeading: "How to convert DOC to EPUB",
    howToName: "How to Convert DOC to EPUB",
    steps: [
      "Open the converter and choose your DOCX file. No account or sign-up required.",
      "Review the chapters and table of contents, and replace the cover if you want.",
      "Edit the title and author, then export your EPUB.",
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
        q: "Will the formatting be kept?",
        a: "Headings in your document are mapped to chapters, and basic text formatting is carried over so you can clean it up before exporting.",
      },
      {
        q: "My file is an older .doc format — will it work?",
        a: "EPUBMaker supports DOCX files. If you have an older .doc file, open it in Word or Google Docs and save it as .docx first, then upload it here.",
      },
      {
        q: "Which readers does the EPUB work on?",
        a: "EPUB works on Apple Books, Kobo, Google Play Books, Calibre, and Adobe Digital Editions. For Kindle, send the EPUB to your device through Amazon.",
      },
    ],
    relatedHeading: "Related",
    related: [
      { href: "/txt-to-epub", label: "Convert TXT to EPUB" },
      { href: "/convert", label: "Open the EPUB converter" },
    ],
    finalCtaText: "Ready to convert your Word document to EPUB?",
  };

  return <ConversionLanding data={data} />;
}
