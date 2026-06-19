import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

type Props = { params: Promise<{ locale: string }> };

const BASE_URL = "https://www.epubmaker.org";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";

  const title = isKo
    ? "Word를 EPUB으로 변환 — 무료 온라인 DOCX to EPUB 변환기"
    : "Word to EPUB Converter — Free Online DOCX to EPUB";
  const description = isKo
    ? "Word(DOCX) 파일을 EPUB 전자책으로 무료 변환. 설치 불필요, 계정 불필요. EPUBMaker로 브라우저에서 바로 전문 EPUB을 만드세요."
    : "Convert Word DOCX files to EPUB ebooks online, free. No installation, no account. Upload your file and download a professional EPUB in seconds.";
  const url = `${BASE_URL}/${locale}/word-to-epub`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/word-to-epub`,
        ko: `${BASE_URL}/ko/word-to-epub`,
      },
    },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function WordToEpubPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  const sectionStyle = {
    marginBottom: 48,
  } as const;

  const h2Style = {
    fontFamily: "var(--font-serif), Georgia, serif",
    fontSize: 22,
    fontWeight: 500,
    color: "var(--lib-ink)",
    marginBottom: 16,
    marginTop: 0,
  } as const;

  const pStyle = {
    fontSize: 15,
    color: "var(--lib-dusk)",
    lineHeight: 1.8,
    marginBottom: 12,
  } as const;

  if (!isKo) {
    const howToJsonLd = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Convert Word to EPUB",
      description:
        "Step-by-step guide to converting a Word DOCX file to a professional EPUB ebook using EPUBMaker.",
      step: [
        {
          "@type": "HowToStep",
          name: "Prepare your Word document",
          text: "Use Word's built-in Heading styles (Heading 1, Heading 2) for chapter titles. This lets EPUBMaker generate a proper table of contents automatically.",
        },
        {
          "@type": "HowToStep",
          name: "Upload your DOCX file",
          text: "Go to EPUBMaker and drag your .docx file onto the upload area, or click to browse. Files up to 50 MB are supported.",
        },
        {
          "@type": "HowToStep",
          name: "Set title, author, and style",
          text: "Enter your book title and author name. Choose a style preset (Default, Book, Novel, or Academic) and optionally upload a cover image.",
        },
        {
          "@type": "HowToStep",
          name: "Convert and download",
          text: "Click Convert to EPUB. Your EPUB file downloads instantly. No account required.",
        },
      ],
      tool: [{ "@type": "HowToTool", name: "EPUBMaker (free online Word to EPUB converter)" }],
      totalTime: "PT3M",
    };

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can I convert Word to EPUB for free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. EPUBMaker is completely free with no usage limits and no account required. Upload your DOCX file and download an EPUB instantly.",
          },
        },
        {
          "@type": "Question",
          name: "Does EPUBMaker support .docx files?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. EPUBMaker supports DOCX (Word) and TXT files. DOCX is the recommended format for the cleanest EPUB output with automatic table of contents generation.",
          },
        },
        {
          "@type": "Question",
          name: "Will my table of contents be preserved?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, if you use Word's built-in Heading styles (Heading 1, Heading 2, Heading 3). EPUBMaker reads these styles and generates a proper EPUB navigation table of contents automatically.",
          },
        },
        {
          "@type": "Question",
          name: "What EPUB version does EPUBMaker produce?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "EPUBMaker produces EPUB 3 by default, which is compatible with all modern ebook readers including Kindle (via send-to-Kindle), Apple Books, Kobo, and more. EPUB 2 is also available for older devices.",
          },
        },
        {
          "@type": "Question",
          name: "Is there a file size limit for Word to EPUB conversion?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "DOCX files up to 50 MB are supported. For most books and manuscripts, this is more than sufficient.",
          },
        },
      ],
    };

    const steps = [
      {
        num: "01",
        title: "Prepare your Word document",
        desc: "Apply Word's built-in Heading styles — Heading 1 for chapter titles, Heading 2 for sections. This is the key to getting an automatic table of contents in your EPUB. Avoid using manual bold or large text; use the Styles panel instead.",
      },
      {
        num: "02",
        title: "Upload to EPUBMaker",
        desc: "Drag your .docx file onto the EPUBMaker upload area or click to browse. Files up to 50 MB are supported. No account or sign-up required.",
      },
      {
        num: "03",
        title: "Configure metadata and style",
        desc: "Enter your book title and author. Choose a style preset: Default (clean and minimal), Book (traditional serif), Novel (immersive reading), or Academic (structured). Optionally add a cover image (JPEG or PNG, up to 10 MB).",
      },
      {
        num: "04",
        title: "Convert and download your EPUB",
        desc: "Click Convert to EPUB. The conversion runs in seconds. Your EPUB file downloads automatically — ready for Apple Books, Kobo, Kindle (via send-to-Kindle), or any EPUB reader.",
      },
    ];

    const features = [
      {
        title: "Automatic TOC from Heading styles",
        desc: "EPUBMaker reads Word's Heading 1/2/3 styles and builds a proper EPUB navigation document automatically.",
      },
      {
        title: "Style presets",
        desc: "Choose from Default, Book, Novel, or Academic CSS presets — or write your own custom CSS.",
      },
      {
        title: "Cover image support",
        desc: "Upload a JPEG or PNG cover (up to 10 MB). Recommended dimensions: 1,600 × 2,400 px.",
      },
      {
        title: "EPUB 3 and EPUB 2",
        desc: "EPUB 3 for modern readers, EPUB 2 for compatibility with older devices. Choose in one click.",
      },
      {
        title: "Metadata editor",
        desc: "Set title, author, language, publisher, and publication date — all standard EPUB metadata fields.",
      },
      {
        title: "No account required",
        desc: "Convert as many Word files as you need. Free forever, no sign-up, no limit.",
      },
    ];

    const faqItems = [
      {
        q: "Can I convert Word to EPUB for free?",
        a: "Yes. EPUBMaker is completely free with no usage limits and no account required. Upload your DOCX file and download an EPUB instantly.",
      },
      {
        q: "Will my table of contents be preserved?",
        a: "Yes — if you used Word's built-in Heading styles (Heading 1, Heading 2, Heading 3). EPUBMaker automatically generates the EPUB navigation table of contents from those styles.",
      },
      {
        q: "What EPUB version does EPUBMaker produce?",
        a: "EPUB 3 by default, compatible with all modern readers. EPUB 2 is also available for older devices.",
      },
      {
        q: "Is there a file size limit?",
        a: "DOCX files up to 50 MB are supported — more than enough for most books.",
      },
      {
        q: "Can I edit the EPUB after conversion?",
        a: "Yes. EPUBMaker includes a built-in block editor. After conversion, edit chapters, reorder content, adjust headings, and re-download — all in the browser.",
      },
    ];

    return (
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 36px 80px",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          color: "var(--lib-ink)",
        }}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

        <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
          Free EPUB Conversion · Word → EPUB
        </p>

        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 500,
            lineHeight: 1.2,
            marginBottom: 20,
            color: "var(--lib-ink)",
          }}
        >
          Word to EPUB Converter —{" "}
          <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>Free & Online</em>
        </h1>

        <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
          Convert your Word DOCX file to a professional EPUB ebook in seconds. EPUBMaker is a free,
          browser-based Word to EPUB converter — no software installation, no account, no limit.
          Upload your manuscript and download a ready-to-publish EPUB instantly.
        </p>

        <div style={{ marginBottom: 40 }}>
          <Link
            href="/convert"
            style={{
              display: "inline-block",
              padding: "13px 32px",
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 7,
              textDecoration: "none",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
            }}
          >
            Convert Word to EPUB — Free
          </Link>
        </div>

        {/* Steps */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>How to Convert Word to EPUB (4 steps)</h2>
          {steps.map(({ num, title, desc }) => (
            <div key={num} style={{ display: "flex", gap: 24, marginBottom: 28 }}>
              <span
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 40,
                  fontWeight: 500,
                  color: "var(--lib-border-2)",
                  lineHeight: 1,
                  flexShrink: 0,
                  minWidth: 52,
                }}
              >
                {num}
              </span>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 17,
                    fontWeight: 500,
                    margin: "0 0 8px",
                    color: "var(--lib-ink)",
                  }}
                >
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Tips */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Tips for the best Word to EPUB output</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {[
              "Use Heading 1 for chapter titles, Heading 2 for sections. This creates a proper EPUB table of contents.",
              "Remove manual page breaks — EPUB is reflowable and handles page breaks automatically.",
              "Embed images directly in the Word document rather than linking to external files.",
              "Use a simple, clean layout. Complex multi-column layouts may not convert well to reflowable EPUB.",
              "Set your document language in Word (Review → Language) to match the book's language.",
            ].map((tip, i) => (
              <li key={i} style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, marginBottom: 10 }}>
                {tip}
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>EPUBMaker features for Word to EPUB conversion</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {features.map(({ title, desc }) => (
              <div
                key={title}
                style={{
                  padding: "16px 18px",
                  borderRadius: 10,
                  background: "var(--lib-bg-2)",
                  border: "1px solid var(--lib-border)",
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 6, marginTop: 0 }}>{title}</p>
                <p style={{ fontSize: 12, color: "var(--lib-dust)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Word vs EPUB comparison */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Why convert Word to EPUB?</h2>
          <p style={pStyle}>
            Word DOCX is great for writing and editing, but it&apos;s not the right format for distributing
            ebooks. EPUB is the standard ebook format supported by Apple Books, Kobo, Google Play Books,
            and most reading apps. Here&apos;s why converting Word to EPUB makes sense:
          </p>
          <div style={{ overflowX: "auto", marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "var(--lib-bg-2)", borderBottom: "2px solid var(--lib-border)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Feature</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Word DOCX</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>EPUB</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Ebook reader support", "Limited", "Universal (Apple Books, Kobo, etc.)"],
                  ["Mobile reading", "Requires Word app", "Any EPUB reader"],
                  ["Font size adjustment", "Fixed", "Reader-controlled"],
                  ["Reflowable layout", "No", "Yes — adapts to any screen"],
                  ["File size", "Often large", "Compact"],
                  ["Self-publishing standard", "Not accepted", "Widely accepted"],
                ].map(([feat, docx, epub], i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: "1px solid var(--lib-border)", background: i % 2 === 0 ? "transparent" : "var(--lib-bg-2)" }}
                  >
                    <td style={{ padding: "11px 16px", fontWeight: 500 }}>{feat}</td>
                    <td style={{ padding: "11px 16px", color: "var(--lib-dusk)" }}>{docx}</td>
                    <td style={{ padding: "11px 16px", color: "var(--lib-wood)" }}>{epub}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Frequently asked questions</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {faqItems.map(({ q, a }, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 0",
                  borderBottom: i < faqItems.length - 1 ? "1px solid var(--lib-border)" : undefined,
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: 16,
                    fontWeight: 500,
                    color: "var(--lib-ink)",
                    margin: "0 0 8px",
                  }}
                >
                  {q}
                </h3>
                <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "40px 0 0" }}>
          <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>
            Ready to convert your Word document to EPUB?
          </p>
          <Link
            href="/convert"
            style={{
              display: "inline-block",
              padding: "13px 32px",
              fontSize: 15,
              fontWeight: 500,
              borderRadius: 7,
              textDecoration: "none",
              background: "var(--lib-wood-dim)",
              color: "#F8F5F0",
            }}
          >
            Convert Word to EPUB — Free
          </Link>
        </div>
      </main>
    );
  }

  // ── Korean version ──────────────────────────────────────────────────────────

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Word를 EPUB으로 변환하는 방법",
    description: "EPUBMaker를 사용해 Word DOCX 파일을 EPUB 전자책으로 변환하는 단계별 가이드",
    step: [
      {
        "@type": "HowToStep",
        name: "Word 문서 준비",
        text: "챕터 제목에 '제목1(Heading 1)', 섹션에 '제목2(Heading 2)' 스타일을 적용합니다. 목차가 자동으로 생성됩니다.",
      },
      {
        "@type": "HowToStep",
        name: "DOCX 파일 업로드",
        text: "EPUBMaker에 DOCX 파일을 드래그 앤 드롭하거나 클릭해서 선택합니다. 최대 50MB까지 지원합니다.",
      },
      {
        "@type": "HowToStep",
        name: "메타데이터 및 스타일 설정",
        text: "제목, 저자를 입력하고 스타일 프리셋(기본, 책, 소설, 학술)을 선택합니다. 표지 이미지도 업로드할 수 있습니다.",
      },
      {
        "@type": "HowToStep",
        name: "변환 및 EPUB 다운로드",
        text: "변환 버튼을 클릭하면 몇 초 만에 EPUB 파일이 다운로드됩니다. 계정 불필요.",
      },
    ],
    tool: [{ "@type": "HowToTool", name: "EPUBMaker (무료 온라인 Word to EPUB 변환기)" }],
    totalTime: "PT3M",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Word를 EPUB으로 무료로 변환할 수 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. EPUBMaker는 완전 무료이며 사용 횟수 제한과 계정이 없습니다. DOCX 파일을 업로드하면 즉시 EPUB으로 변환됩니다.",
        },
      },
      {
        "@type": "Question",
        name: "Word 목차가 EPUB에 그대로 반영되나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Word의 기본 제목 스타일(제목1, 제목2, 제목3)을 사용했다면, EPUBMaker가 이를 자동으로 인식해 EPUB 목차를 생성합니다.",
        },
      },
      {
        "@type": "Question",
        name: "생성되는 EPUB 버전은?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "기본값은 EPUB 3이며 Apple Books, Kobo, 킨들(send-to-Kindle) 등 모든 최신 전자책 리더와 호환됩니다. 구형 기기를 위한 EPUB 2도 선택 가능합니다.",
        },
      },
      {
        "@type": "Question",
        name: "파일 크기 제한이 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DOCX 파일 최대 50MB까지 지원합니다. 대부분의 원고에 충분한 용량입니다.",
        },
      },
      {
        "@type": "Question",
        name: "변환 후 EPUB을 편집할 수 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. EPUBMaker에는 내장 블록 편집기가 있습니다. 변환 후 챕터 편집, 순서 변경, 제목 수정 등을 브라우저에서 바로 할 수 있습니다.",
        },
      },
    ],
  };

  const steps = [
    {
      step: "01",
      title: "Word 문서 준비",
      desc: "챕터 제목에 '제목1(Heading 1)', 섹션에 '제목2(Heading 2)' 스타일을 적용하세요. 스타일 패널을 사용하면 EPUB 변환 시 자동으로 목차가 생성됩니다. 굵은 글씨나 큰 폰트 크기로 제목을 흉내 내지 마세요. Word의 스타일을 꼭 사용해야 합니다.",
    },
    {
      step: "02",
      title: "EPUBMaker에 DOCX 업로드",
      desc: "EPUBMaker 변환 페이지에서 DOCX 파일을 드래그 앤 드롭하거나 클릭해서 선택합니다. 최대 50MB까지 지원. 계정 없이 바로 사용 가능합니다.",
    },
    {
      step: "03",
      title: "제목·저자·스타일 설정",
      desc: "책 제목과 저자명을 입력합니다. 스타일 프리셋(기본, 책, 소설, 학술) 중 하나를 선택하거나 직접 CSS를 작성할 수 있습니다. 표지 이미지(JPEG/PNG, 최대 10MB)를 업로드할 수도 있습니다.",
    },
    {
      step: "04",
      title: "EPUB 변환 및 다운로드",
      desc: "변환 버튼을 클릭하면 수 초 내에 EPUB 파일이 자동으로 다운로드됩니다. Apple Books, Kobo, 킨들(send-to-Kindle), 교보eBook 등 모든 전자책 리더에서 바로 사용할 수 있습니다.",
    },
  ];

  const features = [
    { title: "제목 스타일로 자동 목차 생성", desc: "Heading 1/2/3 스타일을 읽어 EPUB 네비게이션 문서를 자동으로 만들어줍니다." },
    { title: "스타일 프리셋", desc: "기본, 책, 소설, 학술 CSS 프리셋 중 선택하거나 직접 CSS를 작성하세요." },
    { title: "표지 이미지 지원", desc: "JPEG/PNG 표지 이미지 업로드. 권장 크기: 1,600 × 2,400 px." },
    { title: "EPUB 3 / EPUB 2 선택", desc: "최신 EPUB 3(기본) 또는 구형 기기용 EPUB 2를 한 클릭으로 선택." },
    { title: "메타데이터 편집기", desc: "제목, 저자, 언어, 출판사, 발행일 등 EPUB 표준 메타데이터를 모두 설정." },
    { title: "계정·설치 불필요", desc: "브라우저에서 바로 사용, 무제한 무료." },
  ];

  const faqItems = [
    {
      q: "Word를 EPUB으로 무료로 변환할 수 있나요?",
      a: "네. EPUBMaker는 완전 무료이며 사용 횟수 제한과 계정이 없습니다. DOCX 파일을 업로드하면 즉시 EPUB으로 변환됩니다.",
    },
    {
      q: "Word 목차가 EPUB에 그대로 반영되나요?",
      a: "Word의 기본 제목 스타일(제목1, 제목2, 제목3)을 사용했다면, EPUBMaker가 자동으로 인식해 EPUB 목차를 생성합니다.",
    },
    {
      q: "생성되는 EPUB 버전은?",
      a: "기본값은 EPUB 3으로 Apple Books, Kobo, 킨들 등 모든 최신 전자책 리더와 호환됩니다. EPUB 2도 지원합니다.",
    },
    {
      q: "파일 크기 제한이 있나요?",
      a: "DOCX 파일 최대 50MB까지 지원합니다.",
    },
    {
      q: "변환 후 EPUB을 편집할 수 있나요?",
      a: "네. 변환 후 내장 블록 편집기에서 챕터 편집, 순서 변경, 제목 수정 후 재다운로드할 수 있습니다.",
    },
  ];

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "64px 36px 80px",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        color: "var(--lib-ink)",
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
        무료 EPUB 변환 · Word → EPUB
      </p>

      <h1
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 500,
          lineHeight: 1.25,
          marginBottom: 20,
          color: "var(--lib-ink)",
        }}
      >
        Word를 EPUB으로 변환 —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>무료 온라인 변환기</em>
      </h1>

      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
        Word DOCX 파일을 전문 EPUB 전자책으로 무료 변환하세요. EPUBMaker는 설치·계정·비용 없이
        브라우저에서 바로 사용할 수 있는 Word to EPUB 변환기입니다.
        원고를 업로드하면 수 초 안에 출판 가능한 EPUB 파일을 다운로드할 수 있습니다.
      </p>

      <div style={{ marginBottom: 48 }}>
        <Link
          href="/convert"
          style={{
            display: "inline-block",
            padding: "13px 32px",
            fontSize: 15,
            fontWeight: 500,
            borderRadius: 7,
            textDecoration: "none",
            background: "var(--lib-wood-dim)",
            color: "#F8F5F0",
          }}
        >
          Word to EPUB 변환 시작 — 무료
        </Link>
      </div>

      {/* Steps */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>Word를 EPUB으로 변환하는 방법 (4단계)</h2>
        {steps.map(({ step, title, desc }) => (
          <div key={step} style={{ display: "flex", gap: 24, marginBottom: 28 }}>
            <span
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: 40,
                fontWeight: 500,
                color: "var(--lib-border-2)",
                lineHeight: 1,
                flexShrink: 0,
                minWidth: 52,
              }}
            >
              {step}
            </span>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 17,
                  fontWeight: 500,
                  margin: "0 0 8px",
                  color: "var(--lib-ink)",
                }}
              >
                {title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Tips */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>더 깔끔한 변환을 위한 팁</h2>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {[
            "챕터 제목에는 반드시 '제목1(Heading 1)', 섹션 제목에는 '제목2(Heading 2)' 스타일을 사용하세요. 자동 목차가 생성됩니다.",
            "수동 페이지 나누기(Page Break)를 제거하세요. EPUB은 화면에 따라 자동으로 레이아웃을 조정합니다.",
            "이미지는 Word 문서 안에 직접 삽입하고, 외부 링크로 연결하지 마세요.",
            "복잡한 다단(multi-column) 레이아웃은 EPUB 변환 품질이 떨어질 수 있습니다. 단순한 레이아웃이 최적입니다.",
            "Word의 언어 설정(검토 → 언어)을 책의 언어에 맞게 설정하면 EPUB 메타데이터가 자동 반영됩니다.",
          ].map((tip, i) => (
            <li key={i} style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, marginBottom: 10 }}>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>EPUBMaker Word to EPUB 변환 기능</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {features.map(({ title, desc }) => (
            <div
              key={title}
              style={{
                padding: "16px 18px",
                borderRadius: 10,
                background: "var(--lib-bg-2)",
                border: "1px solid var(--lib-border)",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--lib-ink)", marginBottom: 6, marginTop: 0 }}>{title}</p>
              <p style={{ fontSize: 12, color: "var(--lib-dust)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>왜 Word를 EPUB으로 변환해야 할까요?</h2>
        <p style={pStyle}>
          Word DOCX는 글쓰기와 편집에 최적이지만, 전자책 배포 형식으로는 적합하지 않습니다.
          EPUB은 Apple Books, Kobo, 구글 플레이 북스, 국내 교보eBook 등 모든 전자책 플랫폼이 지원하는
          표준 형식입니다.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--lib-bg-2)", borderBottom: "2px solid var(--lib-border)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px" }}>특징</th>
                <th style={{ textAlign: "left", padding: "12px 16px" }}>Word DOCX</th>
                <th style={{ textAlign: "left", padding: "12px 16px" }}>EPUB</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["전자책 리더 지원", "제한적", "범용 (Apple Books, Kobo 등)"],
                ["모바일 읽기", "Word 앱 필요", "모든 EPUB 리더 사용 가능"],
                ["글꼴 크기 조절", "고정", "사용자가 직접 조절"],
                ["유동 레이아웃", "없음", "화면 크기에 자동 적응"],
                ["자가 출판 표준", "미지원", "광범위 지원"],
              ].map(([feat, docx, epub], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--lib-border)", background: i % 2 === 0 ? "transparent" : "var(--lib-bg-2)" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 500 }}>{feat}</td>
                  <td style={{ padding: "11px 16px", color: "var(--lib-dusk)" }}>{docx}</td>
                  <td style={{ padding: "11px 16px", color: "var(--lib-wood)" }}>{epub}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section style={sectionStyle}>
        <h2 style={h2Style}>자주 묻는 질문</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqItems.map(({ q, a }, i) => (
            <div
              key={i}
              style={{
                padding: "24px 0",
                borderBottom: i < faqItems.length - 1 ? "1px solid var(--lib-border)" : undefined,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--lib-ink)",
                  margin: "0 0 8px",
                }}
              >
                {q}
              </h3>
              <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "40px 0 0" }}>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>
          Word 문서를 EPUB으로 변환할 준비가 됐나요?
        </p>
        <Link
          href="/convert"
          style={{
            display: "inline-block",
            padding: "13px 32px",
            fontSize: 15,
            fontWeight: 500,
            borderRadius: 7,
            textDecoration: "none",
            background: "var(--lib-wood-dim)",
            color: "#F8F5F0",
          }}
        >
          Word to EPUB 변환 시작 — 무료
        </Link>
      </div>
    </main>
  );
}
