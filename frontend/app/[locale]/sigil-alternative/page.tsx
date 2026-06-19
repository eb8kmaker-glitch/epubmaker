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
    ? "Sigil 대안 — 설치 없이 브라우저에서 EPUB 제작"
    : "Sigil Alternative — Create EPUBs Online Without Installation";
  const description = isKo
    ? "Sigil 없이도 전문 EPUB 전자책을 만들 수 있습니다. EPUBMaker는 설치 불필요한 무료 웹 기반 EPUB 제작 도구입니다."
    : "Create professional EPUBs without Sigil. EPUBMaker is a free web-based EPUB creator — no installation needed.";
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${locale}/sigil-alternative` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SigilAlternativePage({ params }: Props) {
  const { locale } = await params;
  const isKo = locale === "ko";

  if (!isKo) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 36px", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 36, fontWeight: 500, color: "var(--lib-ink)", marginBottom: 16 }}>
          Sigil Alternative: Create EPUBs Online
        </h1>
        <p style={{ fontSize: 16, color: "var(--lib-dusk)", lineHeight: 1.75, marginBottom: 32 }}>
          EPUBMaker is a free, web-based alternative to Sigil. Create and convert EPUB ebooks directly in your browser — no download, no installation, no account required.
        </p>
        <Link href="/convert" style={{ display: "inline-block", padding: "11px 28px", fontSize: 14, fontWeight: 500, borderRadius: 7, textDecoration: "none", background: "var(--lib-wood-dim)", color: "#F8F5F0" }}>
          Start Creating EPUBs — Free
        </Link>
      </main>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Sigil 대안 — 설치 없이 웹에서 EPUB 제작하기",
    description: "Sigil 없이도 전문 EPUB 전자책을 만들 수 있는 무료 웹 기반 도구 EPUBMaker를 소개합니다.",
    url: "https://www.epubmaker.org/ko/sigil-alternative",
    publisher: { "@type": "Organization", name: "EPUBMaker", url: "https://www.epubmaker.org" },
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
        Sigil 대안 · EPUB 제작 도구
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
        Sigil 없이 EPUB 제작하기 —{" "}
        <em style={{ color: "var(--lib-wood)", fontStyle: "italic" }}>무료 웹 기반 대안</em>
      </h1>

      <p style={{ fontSize: 17, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 40 }}>
        Sigil은 강력한 EPUB 편집기이지만, 설치 과정이 복잡하고 비전공자에게 진입장벽이 높습니다.
        EPUBMaker는 설치가 필요 없는 <strong>웹 기반 EPUB 제작 도구</strong>로, 브라우저만 있으면
        누구나 전문 전자책을 만들 수 있는 <strong>Sigil alternative</strong>입니다.
      </p>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        EPUBMaker vs Sigil — 무엇이 다른가요?
      </h2>

      <div style={{ overflowX: "auto", marginBottom: 40 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "var(--lib-bg-2)", borderBottom: "2px solid var(--lib-border)" }}>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>기능</th>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>EPUBMaker</th>
              <th style={{ textAlign: "left", padding: "12px 16px" }}>Sigil</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["설치 필요 여부", "불필요 (브라우저에서 바로)", "필요 (데스크탑 앱)"],
              ["사용 난이도", "초보자도 5분 안에 시작", "중급 이상 권장"],
              ["가격", "완전 무료", "무료 (오픈소스)"],
              ["입력 형식", "DOCX, TXT", "직접 HTML 편집"],
              ["목차 편집", "자동 생성 + 편집기 제공", "수동 편집"],
              ["운영체제", "웹 브라우저 (어떤 OS든 가능)", "Windows / macOS / Linux"],
            ].map(([feat, epub, sigil], i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--lib-border)", background: i % 2 === 0 ? "transparent" : "var(--lib-bg-2)" }}>
                <td style={{ padding: "11px 16px", fontWeight: 500 }}>{feat}</td>
                <td style={{ padding: "11px 16px", color: "var(--lib-wood)" }}>{epub}</td>
                <td style={{ padding: "11px 16px", color: "var(--lib-dusk)" }}>{sigil}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        EPUBMaker로 EPUB을 만드는 방법
      </h2>
      <ol style={{ paddingLeft: 20, lineHeight: 2, color: "var(--lib-dusk)", marginBottom: 40 }}>
        <li><strong>파일 업로드</strong> — DOCX 또는 TXT 파일을 드래그 앤 드롭합니다.</li>
        <li><strong>메타데이터 설정</strong> — 제목, 저자, 언어, 표지 이미지를 입력합니다.</li>
        <li><strong>스타일 선택</strong> — Default, Book, Novel, Academic 중 선택합니다.</li>
        <li><strong>변환</strong> — 변환 버튼을 누르면 EPUB 파일이 바로 다운로드됩니다.</li>
        <li><strong>편집(선택)</strong> — 내장 목차 편집기로 챕터 순서를 조정할 수 있습니다.</li>
      </ol>

      <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: 22, fontWeight: 500, marginBottom: 16 }}>
        Sigil 대신 EPUBMaker를 사용해야 하는 이유
      </h2>
      <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 16 }}>
        Sigil은 HTML·CSS를 직접 편집하는 전문가용 도구입니다. 반면 EPUBMaker는 <strong>온라인 epub maker</strong>로,
        원고(DOCX/TXT)를 업로드만 하면 나머지를 자동으로 처리합니다. 자가 출판 작가, 블로거,
        강의 자료를 EPUB으로 변환하려는 교육자에게 특히 적합합니다.
      </p>
      <p style={{ fontSize: 15, color: "var(--lib-dusk)", lineHeight: 1.8, marginBottom: 40 }}>
        전자책 제작을 처음 시작하는 분이라면, 복잡한 Sigil보다 EPUBMaker 같은
        <strong> web-based epub creator</strong>로 시작하는 것을 권장합니다.
        나중에 고급 기능이 필요해지면 그때 Sigil을 배워도 늦지 않습니다.
      </p>

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
          지금 바로 EPUB 제작 시작하기 — 무료
        </Link>
      </div>
    </main>
  );
}
