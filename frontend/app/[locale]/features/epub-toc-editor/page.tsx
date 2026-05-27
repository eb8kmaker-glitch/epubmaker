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
    ? "EPUB 목차 편집기 — TOC 편집·재정렬·수정 | EPUBMaker"
    : "EPUB TOC Editor — Edit Table of Contents Free | EPUBMaker";
  const description = isKo
    ? "EPUB 변환 후 목차를 바로 편집하세요. 챕터 순서 변경, 항목 이름 수정, 계층 들여쓰기까지. 무료 온라인 EPUB 목차 편집기."
    : "Edit your EPUB table of contents after conversion. Reorder chapters, rename entries, adjust indent levels — free online EPUB TOC editor. No account needed.";
  const url = `${BASE_URL}/${locale}/features/epub-toc-editor`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${BASE_URL}/${l}/features/epub-toc-editor`])
      ),
    },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EpubTocEditorPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: isKo
      ? [
          {
            "@type": "Question",
            name: "목차 편집기는 변환 후에 사용하나요?",
            acceptedAnswer: { "@type": "Answer", text: "네. DOCX 또는 TXT 파일을 EPUB으로 변환한 뒤 자동으로 편집기가 열리며, 목차 편집 탭에서 바로 수정할 수 있습니다." },
          },
          {
            "@type": "Question",
            name: "목차 항목을 드래그로 재정렬할 수 있나요?",
            acceptedAnswer: { "@type": "Answer", text: "네. 드래그 핸들을 잡아 목차 항목을 원하는 위치로 이동할 수 있습니다. ← / → 키로 들여쓰기(계층)를 조정할 수도 있습니다." },
          },
        ]
      : [
          {
            "@type": "Question",
            name: "When can I use the TOC editor?",
            acceptedAnswer: { "@type": "Answer", text: "After converting a DOCX or TXT file to EPUB, the editor opens automatically. Switch to the TOC tab to edit the table of contents." },
          },
          {
            "@type": "Question",
            name: "Can I reorder TOC entries by dragging?",
            acceptedAnswer: { "@type": "Answer", text: "Yes. Drag any TOC entry using the handle to reorder it. Use the ← / → buttons or keyboard shortcuts to adjust the indent level (hierarchy)." },
          },
        ],
  };

  if (isKo) {
    const features = [
      { title: "드래그로 순서 변경", desc: "드래그 핸들을 잡아 목차 항목을 원하는 위치로 자유롭게 이동합니다." },
      { title: "클릭으로 이름 수정", desc: "항목을 클릭하면 이름을 바로 수정할 수 있습니다. 오타나 챕터 명을 쉽게 바꾸세요." },
      { title: "들여쓰기 계층 조정", desc: "← / → 버튼 또는 단축키로 항목의 계층을 올리거나 내려 구조를 정교하게 만듭니다." },
      { title: "항목 추가·삭제", desc: "필요한 항목을 추가하거나 불필요한 항목을 삭제해 목차를 완전히 재구성합니다." },
      { title: "저장 후 EPUB 다운로드", desc: "편집이 끝나면 '저장 후 다운로드'를 클릭해 새 목차가 반영된 EPUB 파일을 받습니다." },
    ];

    const steps = [
      { num: "01", title: "EPUB 변환", desc: "DOCX 또는 TXT 파일을 EPUBMaker에 업로드하고 EPUB으로 변환합니다. 변환 완료 후 편집기가 자동으로 열립니다." },
      { num: "02", title: "목차 탭 열기", desc: "편집기 사이드바 또는 상단 메뉴에서 목차(TOC) 편집기를 엽니다." },
      { num: "03", title: "목차 편집", desc: "드래그로 항목을 재정렬하고, 클릭으로 이름을 수정하며, ← / → 로 계층을 조정합니다." },
      { num: "04", title: "저장 및 다운로드", desc: "'저장 후 다운로드'를 클릭하면 수정된 목차가 반영된 EPUB 파일이 다운로드됩니다." },
    ];

    const faqs = [
      { q: "목차가 없는 EPUB에서도 편집할 수 있나요?", a: "목차 편집기는 기존 TOC 항목을 수정하는 도구입니다. 목차가 없는 파일은 변환 설정에서 '목차 포함' 옵션을 켜고 재변환하면 생성됩니다." },
      { q: "DOCX 파일의 목차는 어떻게 만들어지나요?", a: "Word의 내장 Heading 스타일(Heading 1, 2, 3)이 EPUB 목차로 자동 변환됩니다. 굵게 처리된 텍스트가 아닌 스타일 패널에서 제목 스타일을 적용해야 합니다." },
      { q: "목차 편집 후 다시 편집할 수 있나요?", a: "네. 다운로드 전까지 언제든 목차 편집기로 돌아와 수정할 수 있습니다. 변경 내용은 브라우저 로컬 저장소에 자동 저장됩니다." },
    ];

    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px 80px", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "var(--lib-ink)" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

        <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
          EPUB 목차 편집 · 온라인 무료
        </p>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20, color: "var(--lib-ink)" }}>
          EPUB 목차 편집기 —{" "}
          <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>TOC를 자유롭게 수정</em>
        </h1>
        <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
          변환 후 목차가 마음에 들지 않으시나요? EPUBMaker의 목차 편집기로 챕터 순서를 바꾸고, 이름을 수정하고, 계층 구조를 조정한 뒤 새 EPUB 파일을 바로 다운로드하세요. 완전 무료, 계정 불필요.
        </p>

        <div style={{ marginBottom: 48 }}>
          <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
            목차 편집 시작하기 — 무료
          </Link>
        </div>

        <section style={{ marginBottom: 52 }}>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 28, marginTop: 0 }}>
            목차 편집기 기능
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {features.map(({ title, desc }, i) => (
              <div key={title} style={{ padding: "20px 0", borderBottom: i < features.length - 1 ? "1px solid var(--lib-border)" : undefined, display: "flex", gap: 20, alignItems: "flex-start" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lib-wood-dim)", flexShrink: 0, marginTop: 7 }} />
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", margin: "0 0 6px" }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
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
          <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>지금 EPUB을 변환하고 목차를 편집해 보세요.</p>
          <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
            목차 편집 시작하기 — 무료
          </Link>
        </div>
      </main>
    );
  }

  // English (and all other locales)
  const features = [
    { title: "Drag to reorder", desc: "Grab any TOC entry by its handle and drag it to a new position in the table of contents." },
    { title: "Click to rename", desc: "Click on any entry to edit its label inline. Fix typos or update chapter names without reconverting." },
    { title: "Adjust indent levels", desc: "Use the ← / → buttons to promote or demote entries. Create multi-level hierarchies (part → chapter → section)." },
    { title: "Add and remove entries", desc: "Add new TOC entries or remove unwanted ones to fully reshape your ebook's navigation." },
    { title: "Save and download", desc: "Click 'Save & Download' to get a new EPUB file with your updated table of contents baked in." },
  ];

  const steps = [
    { num: "01", title: "Convert your file", desc: "Upload a DOCX or TXT file to EPUBMaker and convert it to EPUB. The editor opens automatically after conversion." },
    { num: "02", title: "Open the TOC editor", desc: "In the editor sidebar or menu, open the Table of Contents editor tab." },
    { num: "03", title: "Edit the TOC", desc: "Drag to reorder entries, click to rename them, and use ← / → to adjust indent levels." },
    { num: "04", title: "Save and download", desc: "Click 'Save & Download' to receive a new EPUB with your updated table of contents." },
  ];

  const faqs = [
    { q: "What if my EPUB has no table of contents?", a: "The TOC editor works with existing TOC entries. If your file has no TOC, enable the 'Include Table of Contents' option in conversion settings and re-convert." },
    { q: "How is the TOC generated from a DOCX file?", a: "Word's built-in Heading styles (Heading 1, 2, 3) are automatically converted into EPUB TOC entries. Make sure to use the Styles panel in Word — manually bolded text won't generate a TOC." },
    { q: "Can I edit the TOC multiple times?", a: "Yes. Until you download, you can return to the TOC editor and make further changes. All edits are auto-saved to your browser." },
    { q: "Does editing the TOC affect chapter content?", a: "No. The TOC editor only changes the navigation file (toc.ncx / nav.xhtml). Chapter content remains untouched." },
  ];

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px 80px", fontFamily: "var(--font-sans), system-ui, sans-serif", color: "var(--lib-ink)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
        EPUB TOC Editor · Online & Free
      </p>
      <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 500, lineHeight: 1.25, marginBottom: 20, color: "var(--lib-ink)" }}>
        EPUB TOC Editor —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>Edit Your Table of Contents</em>
      </h1>
      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
        Not happy with how your EPUB table of contents looks after conversion? EPUBMaker's built-in TOC editor lets you reorder, rename, and restructure entries — then download a new EPUB file in seconds. Free, no account required.
      </p>

      <div style={{ marginBottom: 48 }}>
        <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Edit EPUB Table of Contents — Free
        </Link>
      </div>

      <section style={{ marginBottom: 52 }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 28, marginTop: 0 }}>
          TOC editor features
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {features.map(({ title, desc }, i) => (
            <div key={title} style={{ padding: "20px 0", borderBottom: i < features.length - 1 ? "1px solid var(--lib-border)" : undefined, display: "flex", gap: 20, alignItems: "flex-start" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--lib-wood-dim)", flexShrink: 0, marginTop: 7 }} />
              <div>
                <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 16, fontWeight: 500, color: "var(--lib-ink)", margin: "0 0 6px" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--lib-dusk)", lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 52 }}>
        <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 24, marginTop: 0 }}>
          How to edit your EPUB table of contents
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
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", marginBottom: 20 }}>Ready to perfect your EPUB table of contents?</p>
        <Link href="/convert" style={{ display: "inline-block", padding: "13px 32px", fontSize: 15, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Edit EPUB Table of Contents — Free
        </Link>
      </div>
    </main>
  );
}
