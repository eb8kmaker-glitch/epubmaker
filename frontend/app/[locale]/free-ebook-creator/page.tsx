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
    ? "무료 전자책 제작 도구 — 브라우저에서 바로 EPUB 만들기"
    : "Free Ebook Creator — Make EPUBs Online Instantly";
  const description = isKo
    ? "설치 없이 무료로 EPUB 전자책을 만드세요. EPUBMaker는 계정·구독·제한 없이 사용하는 무료 온라인 전자책 제작 도구입니다."
    : "Create EPUB ebooks for free, right in your browser. EPUBMaker is a free online ebook creator with no account, subscription, or limits.";
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/free-ebook-creator` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function FreeEbookCreatorPage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (!isKo) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 36, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 16 }}>
          Free Ebook Creator — Make EPUBs Online
        </h1>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", lineHeight: 1.75, marginBottom: 32 }}>
          EPUBMaker is a completely free online ebook creator. No account, no subscription, no limits. Upload your manuscript and download a professional EPUB in minutes.
        </p>
        <Link href="/convert" style={{ display: "inline-block", padding: "11px 28px", fontSize: 14, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Create Your Ebook — Free
        </Link>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "EPUBMaker — 무료 전자책 제작 도구",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.epubmaker.org",
    description: "계정·구독·제한 없이 무료로 사용하는 웹 기반 EPUB 전자책 제작 도구",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
        무료 전자책 제작 · 온라인 EPUB 메이커
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
        무료 전자책 제작 도구 —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>설치 없이 바로 시작</em>
      </h1>

      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 40 }}>
        EPUBMaker는 <strong>완전 무료 online epub maker</strong>입니다. 회원가입, 구독,
        사용 제한이 없습니다. 원고(DOCX/TXT)를 업로드하면 수분 안에 전문적인 전자책이
        완성됩니다. 이 <strong>free ebook creator</strong>는 자가 출판 작가, 블로거,
        교육자 누구에게나 적합합니다.
      </p>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
        EPUBMaker가 진짜 무료인 이유
      </h2>
      <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 16 }}>
        많은 전자책 제작 도구들이 &quot;무료&quot;라고 광고하지만, 실제로는 파일 크기 제한,
        월간 변환 횟수 제한, 워터마크 삽입, 또는 프리미엄 기능 잠금 등을 적용합니다.
      </p>
      <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 36 }}>
        EPUBMaker는 다릅니다. Pandoc 오픈소스 엔진을 기반으로 하며, 광고 수익으로 운영되기 때문에
        사용자에게 어떠한 비용도 청구하지 않습니다. <strong>영구 무료, 제한 없음</strong>이 기본입니다.
      </p>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 20 }}>
        무료 전자책 제작 도구로 할 수 있는 것들
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          ["DOCX → EPUB 변환", "Word 원고를 EPUB 전자책으로 변환"],
          ["TXT → EPUB 변환", "텍스트 파일 및 Markdown을 EPUB으로"],
          ["자동 목차 생성", "Heading 스타일 기반 자동 TOC"],
          ["표지 이미지 삽입", "JPEG/PNG 표지를 전자책에 추가"],
          ["메타데이터 편집", "제목·저자·언어·출판사·날짜 설정"],
          ["CSS 스타일 커스텀", "4가지 프리셋 + 직접 CSS 입력"],
          ["일괄 변환", "여러 파일을 한 번에 변환 + ZIP 다운로드"],
          ["목차 편집기", "변환 후 챕터 순서·이름 자유롭게 편집"],
        ].map(([title, desc]) => (
          <div
            key={title}
            style={{
              padding: "16px 20px",
              background: "var(--lib-bg-2)",
              borderRadius: 8,
              border: "1px solid var(--lib-border)",
            }}
          >
            <p style={{ fontWeight: 500, fontSize: 14, margin: "0 0 6px", color: "var(--lib-ink)" }}>{title}</p>
            <p style={{ fontSize: 13, color: "var(--lib-dusk)", margin: 0, lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        이런 분들에게 추천합니다
      </h2>
      <ul style={{ paddingLeft: 20, lineHeight: 2.2, color: "var(--lib-dusk)", fontSize: 14, marginBottom: 40 }}>
        <li><strong>자가 출판 작가</strong> — 출판사 없이 직접 전자책을 만들고 싶은 분</li>
        <li><strong>블로거·콘텐츠 크리에이터</strong> — 블로그 글을 묶어 전자책으로 배포하려는 분</li>
        <li><strong>강사·교육자</strong> — 강의 자료를 EPUB 교재로 제작하려는 분</li>
        <li><strong>기업 내부 문서 담당자</strong> — 보고서나 매뉴얼을 전자책으로 변환하려는 분</li>
        <li><strong>번역가</strong> — 번역 원고를 바로 EPUB으로 납품하려는 분</li>
        <li><strong>Sigil 대안을 찾는 분</strong> — 복잡한 설치 없이 epub 제작이 필요한 분</li>
      </ul>

      <div
        style={{
          background: "var(--lib-bg-2)",
          border: "1px solid var(--lib-border)",
          borderRadius: 10,
          padding: "32px",
          marginBottom: 40,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--lib-ink)",
            marginBottom: 8,
          }}
        >
          지금 바로 무료로 전자책을 만들어 보세요
        </p>
        <p style={{ fontSize: 14, color: "var(--lib-dusk)", marginBottom: 24 }}>
          회원가입 불필요 · 설치 불필요 · 제한 없음 · 영구 무료
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
          무료로 전자책 만들기
        </Link>
      </div>
    </main>
  );
}
