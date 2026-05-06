/**
 * 내 변환 기록 + 사용량.
 * 미들웨어에서 로그인 필수로 보호됨.
 *
 * Supabase: createServerClient() — 현재 사용자 세션으로 profiles, conversions 조회.
 */

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@/lib/supabase";
import { Link } from "@/i18n/navigation";
import ConversionList from "@/app/components/ConversionList";

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: conversions } = await supabase
    .from("conversions")
    .select("id, original_filename, original_size_bytes, created_at, status, storage_path, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const t = await getTranslations("Dashboard");

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--content)]">
          {t("title")}
        </h1>
        <p className="mb-8 text-[var(--content-muted)]">
          {t("subtitle")}
        </p>

        <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--content)]">
            {t("usage")}
          </h2>
          <p className="text-sm text-[var(--content-muted)]">
            {t("conversionsCount")}: {(conversions ?? []).length}
          </p>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--content)]">
            {t("recentConversions")}
          </h2>
          <ConversionList conversions={conversions ?? []} />
        </section>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/convert"
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {t("convertMore")}
          </Link>
        </div>
      </main>
    </div>
  );
}
