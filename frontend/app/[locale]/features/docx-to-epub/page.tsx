import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

const BASE_URL = "https://www.epubmaker.org";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo
    ? "DOCX to EPUB 변환기 — Word 파일을 전자책으로 | EPUBMaker"
    : "DOCX to EPUB Converter — Convert Word to EPUB Free | EPUBMaker";
  const description = isKo
    ? "Word DOCX 파일을 EPUB 전자책으로 무료 변환. 목차 자동 생성, 메타데이터 설정, 표지 이미지, CSS 스타일 지원. 브라우저에서 바로, 계정 불필요."
    : "Convert Word DOCX files to EPUB free online. Automatic table of contents from heading styles, metadata, cover image, and style presets. No software install, no account needed.";
  const url = `${BASE_URL}/${locale}/features/docx-to-epub`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}/features/docx-to-epub`])
      ),
    },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function DocxToEpubPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isKo ? "DOCX 파일을 EPUB으로 변환하는 방법" : "How to Convert DOCX to EPUB",
    description: isKo
      ? "Word DOCX 파일을 EPUBMaker로 EPUB 전자책으로 변환하는 단계별 가이드."
      : "Step-by-step guide to converting a Word DOCX file into a professional EPUB ebook using EPUBMaker.",
    step: isKo
      ? [
          { "@type": "HowToStep", name: "DOCX 파일 준비", text: "Word에서 챕터 제목에 Heading 1, 섹션 제목에 Heading 2 스타일을 적용합니다. EPUB 목차는 이 스타일에서 자동 생성됩니다." },
          { "@type": "HowToStep", name: "EPUBMaker에 업로드", text: "DOCX 파일을 EPUBMaker 변환 페이지에 드래그 앤 드롭하거나 클릭해 선택합니다." },
          { "@type": "HowToStep", name: "변환 설정", text: "제목, 저자, 언어를 입력하고 표지 이미지와 CSS 스타일 프리셋을 선택합니다." },
          { "@type": "HowToStep", name: "EPUB 변환 및 다운로드", text: "'EPUB로 변환' 버튼을 클릭합니다. 변환 후 편집기에서 내용을 수정하고 EPUB 파일을 다운로드합니다." },
        ]
      : [
          { "@type": "HowToStep", name: "Prepare your DOCX file", text: "In Word, apply Heading 1 style to chapter titles and Heading 2 to section titles. The EPUB table of contents is auto-generated from these styles." },
          { "@type": "HowToStep", name: "Upload to EPUBMaker", text: "Drag and drop your DOCX file onto EPUBMaker's convert page, or click to browse and select the file." },
          { "@type": "HowToStep", name: "Configure conversion settings", text: "Enter the book title, author, and language. Optionally add a cover image and choose a CSS style preset." },
          { "@type": "HowToStep", name: "Convert and download", text: "Click 'Convert to EPUB'. After conversion, edit the content in the editor if needed, then download your EPUB file." },
        ],
    tool: [{ "@type": "HowToTool", name: "EPUBMaker (free DOCX to EPUB converter)" }],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isKo
      ? [
          { "@type": "Question", name: "DOCX 파일에서 목차가 자동 생성되나요?", acceptedAnswer: { "@type": "Answer", text: "네. Word의 Heading 1, Heading 2, Heading 3 스타일이 적용된 제목들이 자동으로 EPUB 목차 항목이 됩니다. 단, 굵게(Bold) 처리만 한 텍스트는 목차로 인식되지 않습니다." } },
          { "@type": "Question", name: "DOCX 파일 크기 제한이 있나요?", acceptedAnswer: { "@type": "Answer", text: "파일 크기는 50MB 이하여야 합니다. 대부분의 DOCX 파일은 이 범위 안에 해당합니다." } },
        ]
      : [
          { "@type": "Question", name: "Is the table of contents auto-generated from DOCX?", acceptedAnswer: { "@type": "Answer", text: "Yes. Heading 1, 2, and 3 styles in Word are automatically converted into EPUB TOC entries. Manually bolded text is not recognized — you must use Word's Styles panel." } },
          { "@type": "Question", name: "Is there a DOCX file size limit?", acceptedAnswer: { "@type": "Answer", text: "Files must be 50 MB or smaller. Most DOCX manuscripts are well under this limit." } },
        ],
  };

  if (isKo) {
    const features = [
      { title: "자동 목차 생성", desc: "Word의 Heading 1~3 스타일을 자동으로 인식해 EPUB 목차(TOC)를 생성합니다. 목차 깊이(1~3단계)를 설정할 수 있습니다." },
      { title: "메타데이터 설정", desc: "제목, 저자, 언어, 출판사, 날짜를 입력해 전문적인 EPUB 메타데이터를 설정합니다. 편집기에서 변환 후에도 수정 가능합니다." },
      { title: "표지 이미지 업로드", desc: "JPEG 또는 PNG 파일(최대 10MB)을 표지로 업로드합니다. Amazon Kindle 권장 비율인 6:9 크기를 추천합니다." },
      { title: "CSS 스타일 프리셋", desc: "기본·북·소설·학술 스타일 중 선택하거나 직접 CSS를 작성해 전자책의 타이포그래피를 커스터마이즈합니다." },
      { title: "EPUB 2 / 3 지원", desc: "현대 기기를 위한 EPUB 3 또는 구형 리더와의 호환성을 위한 EPUB 2를 선택할 수 있습니다." },
      { title: "변환 후 편집", desc: "변환 완료 즉시 내장 편집기가 열립니다. 챕터 내용을 수정하고, 목차를 조정한 뒤 EPUB을 다운로드합니다." },
    ];

    const steps = [
      { num: "01", title: "DOCX 파일 준비", desc: "Word에서 챕터 제목에 '제목1(Heading 1)', 섹션 제목에 '제목2(Heading 2)' 스타일을 적용합니다. 스타일 패널 사용이 핵심입니다. 굵게 처리된 텍스트는 목차로 인식되지 않습니다." },
      { num: "02", title: "EPUBMaker에 업로드", desc: "변환 페이지에서 DOCX 파일을 드래그 앤 드롭하거나 클릭해 선택합니다. 여러 파일을 한 번에 선택하면 일괄 변환도 가능합니다." },
      { num: "03", title: "변환 설정", desc: "제목과 저자를 입력하고, 원하면 표지 이미지와 스타일 프리셋을 선택합니다. 고급 설정에서 EPUB 버전·목차 깊이·언어를 지정합니다." },
      { num: "04", title: "변환 및 편집", desc: "'EPUB로 변환' 버튼을 클릭합니다. 변환 후 편집기가 열리면 내용을 확인하고 수정한 뒤 EPUB 파일을 다운로드합니다." },
    ];

    const tips = [
      { title: "Heading 스타일 필수", desc: "EPUB 목차는 Word의 Heading 스타일에서 자동 생성됩니다. 홈 탭 → 스타일 패널에서 '제목1', '제목2'를 적용하세요." },
      { title: "이미지 확인", desc: "DOCX 안의 이미지는 EPUB에 자동으로 포함됩니다. 이미지가 누락된다면 파일에 직접 삽입되었는지 확인하세요." },
      { title: "파일 크기", desc: "50MB 이하 파일을 지원합니다. 이미지가 많은 파일은 크기를 미리 확인하세요." },
    ];

    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px 80px", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "var(--lib-ink)" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

        <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
          DOCX → EPUB 변환 가이드
        </p>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20, color: "var(--lib-ink)" }}>
          DOCX to EPUB 변환기 —{" "}
          <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>Word 파일을 전자책으로</em>
        </h1>
        <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
          Microsoft Word DOCX 파일을 EPUB 전자책으로 변환하는 가장 깔끔한 방법. EPUBMaker는 Word의 Heading 스타일을 읽어 목차를 자동 생성하고, 표지 이미지·메타데이터·CSS 스타일까지 한 번에 설정할 수 있습니다. 완전 무료, 설치 불필요.
        </p>

        <div style={{ marginBottom: 48 }}>
          <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
            DOCX to EPUB 변환 시작 — 무료
          </Link>
        </div>

        <section style={{ marginBottom: 52 }}>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 28, marginTop: 0 }}>
            DOCX 변환 기능
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {features.map(({ title, desc }) => (
              <div key={title} style={{ padding: "20px 24px", background: "var(--lib-bg-2)", borderRadius: 8, border: "1px solid var(--lib-border)" }}>
                <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--lib-dusk)", lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 52 }}>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 24, marginTop: 0 }}>
            DOCX to EPUB 변환 방법
          </h2>
          {steps.map(({ num, title, desc }) => (
            <div key={num} style={{ display: "flex", gap: 24, marginBottom: 28 }}>
              <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 40, fontWeight: 500, color: "var(--lib-border-2)", lineHeight: 1, flexShrink: 0, minWidth: 52 }}>{num}</span>
              <div>
                <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 17, fontWeight: 500, margin: "0 0 8px", color: "var(--lib-ink)" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section style={{ marginBottom: 52, padding: "24px 28px", background: "var(--lib-bg-2)", borderRadius: 8, border: "1px solid var(--lib-border)" }}>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 20, marginTop: 0 }}>
            더 좋은 결과를 위한 팁
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {tips.map(({ title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lib-wood-dim)", flexShrink: 0, marginTop: 7 }} />
                <div>
                  <strong style={{ fontSize: 14, color: "var(--lib-ink)" }}>{title}: </strong>
                  <span style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.7 }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ textAlign: "center", padding: "40px 0 0" }}>
          <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>Word 파일을 지금 바로 EPUB으로 변환하세요.</p>
          <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
            DOCX to EPUB 변환 시작 — 무료
          </Link>
        </div>
      </main>
    );
  }

  // English (and all other locales)
  const features = [
    { title: "Automatic table of contents", desc: "EPUBMaker reads Word's Heading 1, 2, and 3 styles to generate the EPUB TOC automatically. Configure TOC depth (1–3 levels)." },
    { title: "Metadata settings", desc: "Enter title, author, language, publisher, and date. All metadata is embedded in the EPUB and editable after conversion." },
    { title: "Cover image upload", desc: "Upload a JPEG or PNG cover image (up to 10 MB). Recommended dimensions: 1,600 × 2,560 px for Kindle compatibility." },
    { title: "CSS style presets", desc: "Choose from Default, Book, Novel, or Academic style presets — or write your own custom CSS for full typography control." },
    { title: "EPUB 2 & 3 support", desc: "Select EPUB 3 for modern reading apps (recommended) or EPUB 2 for compatibility with older e-readers." },
    { title: "Post-conversion editor", desc: "After conversion, the built-in editor opens immediately. Edit chapter content, adjust the TOC, and download your final EPUB." },
  ];

  const steps = [
    { num: "01", title: "Prepare your DOCX file", desc: "In Word, apply Heading 1 to chapter titles and Heading 2 to section titles using the Styles panel (Home → Styles). This is essential — manually bolded text is not recognized for TOC generation." },
    { num: "02", title: "Upload to EPUBMaker", desc: "Drag and drop your DOCX file onto the convert page, or click to browse. You can select multiple files for batch conversion." },
    { num: "03", title: "Configure settings", desc: "Enter the title, author, and optionally a cover image and style preset. In advanced settings, choose EPUB version, TOC depth, and language." },
    { num: "04", title: "Convert and download", desc: "Click 'Convert to EPUB'. The editor opens after conversion — review and edit the content, then download your EPUB file." },
  ];

  const tips = [
    { title: "Use Heading styles", desc: "The EPUB table of contents is built from Word's Heading styles. Apply them from the Styles panel — bold formatting alone won't generate a TOC." },
    { title: "Embedded images", desc: "Images inserted directly into the DOCX are automatically included in the EPUB. If images are missing, make sure they are embedded (not linked)." },
    { title: "File size", desc: "Files must be 50 MB or smaller. Check file size before uploading if your document contains many high-resolution images." },
  ];

  const faqs = [
    { q: "Is the table of contents generated automatically?", a: "Yes. Heading 1, 2, and 3 styles in your DOCX are automatically converted to EPUB TOC entries. Use Word's Styles panel — manually bolded text is not recognized." },
    { q: "Do images in the DOCX file transfer to EPUB?", a: "Yes. Images embedded in the DOCX are automatically included in the EPUB output. Linked (not embedded) images may not transfer correctly." },
    { q: "Is there a file size limit?", a: "Files must be 50 MB or smaller. Most DOCX manuscripts, even with images, are well under this limit." },
    { q: "Can I edit the EPUB content after conversion?", a: "Yes. EPUBMaker's built-in block editor opens automatically after conversion. Edit text, manage chapters, update metadata, and download the final EPUB — all in the browser." },
    { q: "Which EPUB version should I choose?", a: "EPUB 3 is recommended for all modern reading apps (Apple Books, Kobo, Kindle via send-to-Kindle). Use EPUB 2 only if you need compatibility with very old devices." },
  ];

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px 80px", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "var(--lib-ink)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
        DOCX to EPUB Conversion Guide
      </p>
      <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20, color: "var(--lib-ink)" }}>
        DOCX to EPUB Converter —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>Convert Word to EPUB Free</em>
      </h1>
      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
        The cleanest way to turn a Microsoft Word document into a professional EPUB ebook. EPUBMaker reads your DOCX file's heading structure to generate a table of contents automatically — and gives you full control over metadata, cover image, style, and EPUB version. Free, no software install, no account required.
      </p>

      <div style={{ marginBottom: 48 }}>
        <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Convert DOCX to EPUB — Free
        </Link>
      </div>

      <section style={{ marginBottom: 52 }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 28, marginTop: 0 }}>
          DOCX conversion features
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          {features.map(({ title, desc }) => (
            <div key={title} style={{ padding: "20px 24px", background: "var(--lib-bg-2)", borderRadius: 8, border: "1px solid var(--lib-border)" }}>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", margin: "0 0 8px" }}>{title}</h3>
              <p style={{ fontSize: 13, color: "var(--lib-dusk)", lineHeight: 1.7, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 52 }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 24, marginTop: 0 }}>
          How to convert DOCX to EPUB
        </h2>
        {steps.map(({ num, title, desc }) => (
          <div key={num} style={{ display: "flex", gap: 24, marginBottom: 28 }}>
            <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 40, fontWeight: 500, color: "var(--lib-border-2)", lineHeight: 1, flexShrink: 0, minWidth: 52 }}>{num}</span>
            <div>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 17, fontWeight: 500, margin: "0 0 8px", color: "var(--lib-ink)" }}>{title}</h3>
              <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 52, padding: "24px 28px", background: "var(--lib-bg-2)", borderRadius: 8, border: "1px solid var(--lib-border)" }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 18, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 20, marginTop: 0 }}>
          Tips for better results
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {tips.map(({ title, desc }) => (
            <div key={title} style={{ display: "flex", gap: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lib-wood-dim)", flexShrink: 0, marginTop: 7 }} />
              <div>
                <strong style={{ fontSize: 14, color: "var(--lib-ink)" }}>{title}: </strong>
                <span style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.7 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 16, marginTop: 0 }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {faqs.map(({ q, a }, i) => (
            <div key={i} style={{ padding: "24px 0", borderBottom: i < faqs.length - 1 ? "1px solid var(--lib-border)" : undefined }}>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", margin: "0 0 8px" }}>{q}</h3>
              <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.75, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{ textAlign: "center", padding: "40px 0 0" }}>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>Ready to convert your Word document to EPUB?</p>
        <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Convert DOCX to EPUB — Free
        </Link>
      </div>
    </main>
  );
}
