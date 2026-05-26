import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  const title = isKo
    ? "PDF를 EPUB으로 변환하는 방법 — 완벽 가이드"
    : "How to Convert PDF to EPUB — Complete Guide";
  const description = isKo
    ? "PDF를 EPUB으로 변환하는 가장 좋은 방법을 안내합니다. EPUBMaker로 전자책을 무료로 제작하세요."
    : "Learn the best way to convert PDF to EPUB. Use EPUBMaker to create free, professional ebooks online.";
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PdfToEpubPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (!isKo) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 36, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 16 }}>
          How to Convert PDF to EPUB
        </h1>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", lineHeight: 1.75, marginBottom: 32 }}>
          EPUBMaker supports DOCX and TXT to EPUB conversion. For PDFs, export to Word first, then upload to EPUBMaker for clean, professional EPUB output.
        </p>
        <Link href="/convert" style={{ display: "inline-block", padding: "11px 28px", fontSize: 14, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Convert to EPUB — Free
        </Link>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "PDF를 EPUB으로 직접 변환할 수 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "EPUBMaker는 현재 DOCX와 TXT 파일의 epub 변환을 지원합니다. PDF는 Word(DOCX)로 변환 후 업로드하면 EPUB으로 만들 수 있습니다.",
        },
      },
      {
        "@type": "Question",
        name: "PDF를 DOCX로 변환하는 가장 좋은 방법은?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Adobe Acrobat, Microsoft Word의 PDF 열기 기능, 또는 SmallPDF, ILovePDF 같은 무료 온라인 도구를 사용하면 PDF를 DOCX로 변환할 수 있습니다.",
        },
      },
    ],
  };

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <p style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--lib-dust)", marginBottom: 16 }}>
        EPUB 변환 가이드 · PDF → EPUB
      </p>

      <h1
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "clamp(28px, 4vw, 40px)",
          fontWeight: 500,
          lineHeight: 1.25,
          marginBottom: 20,
        }}
      >
        PDF를 EPUB으로 변환하는 방법 —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>완벽 가이드</em>
      </h1>

      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 40 }}>
        많은 분들이 PDF 파일을 EPUB 전자책으로 변환하고 싶어합니다. EPUB 형식은 화면 크기에 맞게
        텍스트가 자동으로 재배치되어 모바일·태블릿에서 훨씬 읽기 편합니다. 이 가이드에서는
        PDF를 EPUB으로 변환하는 가장 효과적인 방법을 설명합니다.
      </p>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        EPUBMaker의 epub 변환 지원 형식
      </h2>
      <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 12 }}>
        EPUBMaker는 현재 <strong>DOCX(Word)와 TXT 파일</strong>을 EPUB으로 변환합니다.
        PDF 직접 변환은 지원하지 않습니다. 이는 PDF의 고정 레이아웃 특성상 텍스트를
        정확하게 추출하기 어렵기 때문입니다.
      </p>
      <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 40 }}>
        하지만 걱정하지 마세요. PDF를 먼저 DOCX로 변환한 후 EPUBMaker에 업로드하면
        깔끔한 EPUB 파일을 얻을 수 있습니다.
      </p>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
        PDF → EPUB 변환 단계별 방법
      </h2>

      {[
        {
          step: "01",
          title: "PDF를 DOCX로 변환",
          desc: "Adobe Acrobat(유료), Microsoft Word의 PDF 열기 기능(무료), 또는 SmallPDF·ILovePDF 같은 무료 온라인 도구를 사용해 PDF를 DOCX로 변환합니다. 텍스트 기반 PDF는 변환 품질이 좋지만, 이미지로 스캔된 PDF는 OCR 처리가 필요합니다.",
        },
        {
          step: "02",
          title: "DOCX에서 제목 스타일 확인",
          desc: "Word에서 변환된 DOCX를 열어 목차가 될 부분에 '제목1', '제목2' 스타일이 올바르게 적용되어 있는지 확인합니다. 자동 변환 시 스타일이 깨지는 경우가 많으므로 이 단계가 중요합니다. EPUB 목차는 Heading 스타일에서 자동 생성됩니다.",
        },
        {
          step: "03",
          title: "EPUBMaker로 epub 변환",
          desc: "정리된 DOCX 파일을 EPUBMaker에 업로드합니다. 제목, 저자, 표지 이미지를 설정하고 변환 버튼을 클릭하면 전문적인 EPUB 파일이 완성됩니다. 이 온라인 epub maker는 완전 무료이며 계정이 필요 없습니다.",
        },
        {
          step: "04",
          title: "EPUB 테스트",
          desc: "다운로드한 EPUB 파일을 Thorium Reader(무료 데스크탑), Apple Books(iOS/macOS), 또는 Google Play Books에서 열어 내용을 확인합니다. 목차가 올바른지, 이미지가 표시되는지 점검하세요.",
        },
      ].map(({ step, title, desc }) => (
        <div key={step} style={{ display: "flex", gap: 24, marginBottom: 32 }}>
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
                fontSize: 18,
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

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, margin: "40px 0 16px" }}>
        PDF와 EPUB의 차이점
      </h2>
      <div style={{ overflowX: "auto", marginBottom: 40 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "var(--lib-bg-2)", borderBottom: "2px solid var(--lib-border)" }}>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>특징</th>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>PDF</th>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>EPUB</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["레이아웃", "고정 (인쇄 형태)", "유동적 (화면 크기 적응)"],
              ["모바일 가독성", "확대/축소 필요", "자동으로 최적화"],
              ["글꼴 크기 조절", "불가", "사용자가 직접 조절"],
              ["전자책 리더 지원", "제한적", "광범위 (Apple Books, Kobo 등)"],
              ["파일 크기", "크거나 작음", "일반적으로 작음"],
            ].map(([feat, pdf, epub], i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--lib-border)", background: i % 2 === 0 ? "transparent" : "var(--lib-bg-2)" }}>
                <td style={{ padding: "11px 16px", fontWeight: 500 }}>{feat}</td>
                <td style={{ padding: "11px 16px", color: "var(--lib-dusk)" }}>{pdf}</td>
                <td style={{ padding: "11px 16px", color: "var(--lib-wood)" }}>{epub}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: "center", padding: "40px 0" }}>
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
          EPUB 변환 시작하기 — 무료
        </Link>
      </div>
    </main>
  );
}
