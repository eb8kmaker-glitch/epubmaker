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
    ? "EPUB 만드는 방법 — 초보자를 위한 완벽 가이드"
    : "How to Make an EPUB — Beginner's Complete Guide";
  const description = isKo
    ? "EPUB 파일을 처음 만드는 분을 위한 단계별 가이드. EPUBMaker로 브라우저에서 5분 안에 전자책을 완성하는 방법을 안내합니다."
    : "Step-by-step guide to creating your first EPUB file. Learn how to make an ebook online in minutes with EPUBMaker.";
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function HowToMakeEpubPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (!isKo) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 36, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 16 }}>
          How to Make an EPUB File Online
        </h1>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", lineHeight: 1.75, marginBottom: 32 }}>
          Creating an EPUB has never been easier. Upload your DOCX or TXT file to EPUBMaker, configure your settings, and download a professional EPUB in minutes — for free.
        </p>
        <Link href="/convert" style={{ display: "inline-block", padding: "11px 28px", fontSize: 14, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Make an EPUB Now — Free
        </Link>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "EPUB 파일 만드는 방법",
    description: "EPUBMaker를 사용하여 브라우저에서 EPUB 전자책을 만드는 단계별 가이드",
    step: [
      { "@type": "HowToStep", name: "파일 준비", text: "DOCX 또는 TXT 형식으로 원고를 준비합니다." },
      { "@type": "HowToStep", name: "파일 업로드", text: "EPUBMaker에 파일을 드래그 앤 드롭합니다." },
      { "@type": "HowToStep", name: "메타데이터 입력", text: "제목, 저자, 언어를 입력합니다." },
      { "@type": "HowToStep", name: "변환 및 다운로드", text: "변환 버튼을 클릭하면 EPUB 파일이 다운로드됩니다." },
    ],
    tool: [{ "@type": "HowToTool", name: "EPUBMaker (무료 온라인 epub maker)" }],
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
        EPUB 제작 가이드 · 초보자용
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
        EPUB 만드는 방법 —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>5분 완성 가이드</em>
      </h1>

      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 40 }}>
        EPUB은 전 세계 전자책 리더(킨들 제외)의 표준 포맷입니다. 복잡한 소프트웨어 없이도
        <strong> 온라인 epub 제작</strong>이 가능합니다. EPUBMaker를 사용하면 브라우저에서
        바로 전문적인 전자책을 만들 수 있습니다.
      </p>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
        EPUB 제작 전 준비사항
      </h2>
      <ul style={{ paddingLeft: 20, lineHeight: 2, color: "var(--lib-dusk)", marginBottom: 36 }}>
        <li><strong>원고 파일</strong> — DOCX(Word) 또는 TXT 형식. 50MB 이하.</li>
        <li><strong>목차를 위한 Heading 스타일</strong> — DOCX의 경우 Word에서 제목1/제목2/제목3 스타일 사용.</li>
        <li><strong>표지 이미지(선택)</strong> — JPEG 또는 PNG, 최대 10MB. 권장 크기: 1,600×2,400px.</li>
        <li><strong>메타데이터</strong> — 책 제목, 저자명, 언어 코드(예: ko).</li>
      </ul>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
        단계별 EPUB 제작 방법
      </h2>

      {[
        {
          step: "01",
          title: "EPUBMaker에 파일 업로드",
          desc: "epubmaker.org/convert 페이지에서 DOCX 또는 TXT 파일을 드래그 앤 드롭합니다. 여러 파일을 한 번에 업로드하는 일괄 변환도 지원합니다. 이 무료 epub 제작 도구는 별도 회원가입이 필요 없습니다.",
        },
        {
          step: "02",
          title: "제목·저자·언어 입력",
          desc: "전자책의 메타데이터를 입력합니다. 제목과 저자는 전자책 리더에 표시되므로 정확하게 입력하세요. 언어는 전자책의 텍스트 방향과 가독성에 영향을 줍니다.",
        },
        {
          step: "03",
          title: "스타일 및 표지 설정",
          desc: "Default, Book, Novel, Academic 4가지 CSS 스타일 중 하나를 선택합니다. 표지 이미지를 업로드하면 전자책의 첫 페이지에 삽입됩니다. 목차 깊이(1~3단계)도 이 단계에서 설정합니다.",
        },
        {
          step: "04",
          title: "변환 및 다운로드",
          desc: "변환 버튼을 클릭하면 Pandoc 엔진이 EPUB 파일을 생성합니다. 완성된 EPUB은 브라우저에서 바로 다운로드됩니다. 필요하면 내장 목차 편집기로 챕터를 재정렬하거나 이름을 변경할 수 있습니다.",
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
        EPUB 제작 팁
      </h2>
      <ul style={{ paddingLeft: 20, lineHeight: 2.2, color: "var(--lib-dusk)", fontSize: 14, marginBottom: 40 }}>
        <li>DOCX에서 굵게(Bold)로 처리한 텍스트는 목차로 인식되지 않습니다. 반드시 Word의 &quot;제목1&quot; 스타일을 사용하세요.</li>
        <li>TXT 파일은 Markdown 헤딩(# 챕터, ## 섹션)을 사용하면 목차가 자동 생성됩니다.</li>
        <li>킨들(Amazon Kindle)용으로 배포하려면 EPUB 파일을 킨들 다이렉트 퍼블리싱에 업로드하거나, Calibre로 MOBI/AZW3로 변환하세요.</li>
        <li>표준 epub 변환 결과를 확인하려면 무료 리더 앱 &quot;Thorium Reader&quot; 또는 &quot;Apple Books&quot;에서 테스트하세요.</li>
      </ul>

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
          지금 EPUB 만들기 — 무료
        </Link>
      </div>
    </main>
  );
}
