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
    ? "EPUB 편집기 — 브라우저에서 전자책 직접 편집 | EPUBMaker"
    : "EPUB Editor — Edit EPUB Files Online Free | EPUBMaker";
  const description = isKo
    ? "업로드 즉시 EPUB 편집기로 연결. 챕터 관리, 블록 편집, 메타데이터 수정, 실시간 미리보기를 브라우저에서 무료로. 계정 불필요."
    : "Upload your document and edit it instantly in our free online EPUB editor. Manage chapters, edit content blocks, update metadata, and preview — all in your browser.";
  const url = `${BASE_URL}/${locale}/features/epub-editor`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}/features/epub-editor`])
      ),
    },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EpubEditorPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EPUBMaker EPUB Editor",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    url: `${BASE_URL}/${locale}/features/epub-editor`,
    description: isKo
      ? "브라우저 기반 EPUB 편집기. 챕터 관리, 블록 편집, 메타데이터 수정, 실시간 미리보기."
      : "Browser-based EPUB editor with chapter management, block editing, metadata editing, and live preview.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  if (isKo) {
    const features = [
      {
        title: "블록 기반 편집",
        desc: "본문·소제목·인용·이미지 블록을 자유롭게 추가하고 편집합니다. '/' 명령어로 블록 타입을 즉시 변경할 수 있습니다.",
      },
      {
        title: "챕터 관리",
        desc: "드래그로 챕터 순서를 변경하고, 챕터를 분할·병합·삭제할 수 있습니다. 더블클릭으로 제목을 바로 수정합니다.",
      },
      {
        title: "실시간 미리보기",
        desc: "Kindle 스타일 프레임에서 변경 사항을 즉시 확인합니다. 실제 전자책 리더에서 어떻게 보일지 그대로 미리볼 수 있습니다.",
      },
      {
        title: "메타데이터 편집",
        desc: "제목, 저자, 언어, 출판사, 날짜를 편집기 안에서 바로 수정합니다. 변환 후에도 언제든 변경 가능합니다.",
      },
      {
        title: "목차(TOC) 편집",
        desc: "내장 목차 편집기로 챕터 순서·이름·계층 구조를 조정합니다. 드래그로 재정렬, 들여쓰기로 계층을 설정합니다.",
      },
      {
        title: "EPUB 2 / 3 선택",
        desc: "최신 기기를 위한 EPUB 3 또는 구형 리더와의 호환성을 위한 EPUB 2 중 선택합니다.",
      },
    ];

    const steps = [
      { num: "01", title: "파일 업로드", desc: "DOCX 또는 TXT 파일을 드래그 앤 드롭하거나 '빈 문서로 시작하기'를 선택합니다." },
      { num: "02", title: "편집기 자동 실행", desc: "변환이 완료되면 챕터 구조가 자동으로 분석되어 편집기가 바로 열립니다." },
      { num: "03", title: "내용 편집", desc: "챕터를 클릭해 내용을 수정하고, 블록을 추가·삭제하며 구성을 완성합니다." },
      { num: "04", title: "EPUB 다운로드", desc: "편집이 끝나면 상단 버튼으로 EPUB을 즉시 다운로드합니다. 서버에 파일이 남지 않습니다." },
    ];

    const faqs = [
      { q: "파일 없이 편집기를 열 수 있나요?", a: "네. 변환 페이지에서 '빈 문서로 시작하기'를 누르면 빈 편집기가 바로 열립니다. 처음부터 직접 전자책을 작성할 수 있습니다." },
      { q: "어떤 블록 타입을 지원하나요?", a: "본문(단락), 소제목(H2), 소소제목(H3), 인용구, 이미지 블록을 지원합니다. '/' 명령어로 빠르게 타입을 전환할 수 있습니다." },
      { q: "챕터는 몇 개까지 만들 수 있나요?", a: "챕터 수 제한이 없습니다. 필요한 만큼 추가하고, 드래그로 순서를 변경하거나 분할·병합하세요." },
      { q: "편집 내용은 자동 저장되나요?", a: "네. 브라우저의 로컬 저장소에 자동 저장됩니다. 페이지를 닫아도 작업이 유지됩니다." },
    ];

    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px 80px", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "var(--lib-ink)" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />

        <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
          EPUB Editor · 온라인 무료
        </p>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20, color: "var(--lib-ink)" }}>
          EPUB 편집기 —{" "}
          <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>브라우저에서 직접 편집</em>
        </h1>
        <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
          EPUBMaker의 내장 EPUB 편집기는 파일 변환 직후 바로 실행됩니다. 챕터 단위로 내용을 편집하고, 목차를 조정하고, 메타데이터를 수정한 뒤 완성된 EPUB을 다운로드하세요. 설치도, 계정도 필요 없습니다.
        </p>

        <div style={{ marginBottom: 48 }}>
          <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
            편집기 열기 — 무료
          </Link>
        </div>

        <section style={{ marginBottom: 52 }}>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 28, marginTop: 0 }}>
            편집기 주요 기능
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
            사용 방법
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

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 16, marginTop: 0 }}>
            자주 묻는 질문
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
          <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>지금 바로 전자책 편집을 시작하세요.</p>
          <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
            편집기 열기 — 무료
          </Link>
        </div>
      </main>
    );
  }

  // English (and all other locales)
  const features = [
    { title: "Block-based editing", desc: "Add and edit paragraph, heading, quote, and image blocks freely. Use '/' commands to instantly change block types." },
    { title: "Chapter management", desc: "Drag to reorder chapters, split long chapters, merge adjacent ones, or delete. Double-click any chapter title to rename it." },
    { title: "Live preview", desc: "Preview your ebook instantly in a Kindle-style frame. See exactly how it will look in a real ebook reader — before you download." },
    { title: "Metadata editing", desc: "Update title, author, language, publisher, and date directly in the editor — even after conversion." },
    { title: "TOC editor", desc: "Use the built-in TOC editor to reorder, rename, indent, or remove entries from your table of contents." },
    { title: "EPUB 2 / 3", desc: "Choose EPUB 3 for modern devices or EPUB 2 for broader compatibility with older e-readers." },
  ];

  const steps = [
    { num: "01", title: "Upload your file", desc: "Drag and drop a DOCX or TXT file, or click 'Start with a blank document' to open a fresh editor." },
    { num: "02", title: "Editor opens automatically", desc: "After conversion, your document is split into chapters and the editor opens immediately — no extra steps." },
    { num: "03", title: "Edit your content", desc: "Click into any chapter to edit text. Add, remove, or rearrange blocks. Drag chapters to reorder them." },
    { num: "04", title: "Download your EPUB", desc: "Click the download button when you're done. Your EPUB is generated in-browser — nothing is stored on our servers." },
  ];

  const faqs = [
    { q: "Can I open the editor without uploading a file?", a: "Yes. On the convert page, click 'Start with a blank document' to open a blank editor and write your ebook from scratch." },
    { q: "What block types are supported?", a: "Body text (paragraph), heading (H2), subheading (H3), blockquote, and image blocks. Use the '/' command to switch types quickly." },
    { q: "Is there a chapter limit?", a: "No. Add as many chapters as you need. Drag to reorder, split at any block, or merge adjacent chapters." },
    { q: "Are my edits saved automatically?", a: "Yes. Edits are auto-saved to your browser's local storage. Your work persists even if you close the tab." },
  ];

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px 80px", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "var(--lib-ink)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />

      <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
        EPUB Editor · Online & Free
      </p>
      <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20, color: "var(--lib-ink)" }}>
        EPUB Editor —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>Edit Your Ebook in the Browser</em>
      </h1>
      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
        EPUBMaker's built-in EPUB editor opens automatically after you convert or upload a file. Edit chapters, update metadata, preview your ebook, and download — all without leaving your browser. No software, no account required.
      </p>

      <div style={{ marginBottom: 48 }}>
        <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Open EPUB Editor — Free
        </Link>
      </div>

      <section style={{ marginBottom: 52 }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 28, marginTop: 0 }}>
          Editor features
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
          How to use the editor
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
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>Ready to start editing your ebook?</p>
        <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Open EPUB Editor — Free
        </Link>
      </div>
    </main>
  );
}
