import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import ConvertFlow from "@/app/components/convert/ConvertFlow";
import AdBanner from "@/app/components/ads/AdBanner";

const BASE_URL = "https://www.epubmaker.org";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `${BASE_URL}/${locale}/convert`,
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `${BASE_URL}/${loc}/convert`])
      ),
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default function ConvertPage() {
  return (
    <div style={{ background: "var(--lib-panel)", minHeight: "calc(100vh - 60px)" }}>
      <ConvertFlow />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 28px 56px", width: "100%" }}>
        <div className="ad-unit-wrapper" style={{ margin: "40px 0" }}>
          <span className="ad-label">advertisement</span>
          <AdBanner adSlot="5346839792" />
        </div>
      </div>
    </div>
  );
}
