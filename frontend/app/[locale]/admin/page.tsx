/**
 * 관리자 대시보드.
 *
 * - ADMIN_EMAIL 환경변수와 로그인 이메일 불일치 시 /dashboard로 리다이렉트.
 * - 미들웨어에서도 1차 보호, 여기서 2차 검증.
 * - Supabase Admin 클라이언트로 users, conversions, subscription_events 조회.
 */

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient, createAdminClient } from "@/lib/supabase";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    redirect(`/${locale}/dashboard`);
  }

  const admin = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalUsersResult,
    planStatsResult,
    totalConversionsResult,
    todayConversionsResult,
    activeSubscribersResult,
    recentConversionsResult,
    webhookEventsResult,
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }),
    admin.from("users").select("subscription_plan"),
    admin.from("conversions").select("*", { count: "exact", head: true }),
    admin
      .from("conversions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active")
      .neq("subscription_plan", "free"),
    admin
      .from("conversions")
      .select("id, user_id, original_filename, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("subscription_events")
      .select("id, user_id, event_type, processed, created_at, error")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // 플랜별 사용자 집계
  const planBreakdown: Record<string, number> = {};
  for (const u of planStatsResult.data ?? []) {
    const plan = (u.subscription_plan as string) ?? "free";
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1;
  }

  // 최근 가입자 10명 (auth.admin API)
  let recentSignups: Array<{ id: string; email?: string; created_at: string }> = [];
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 50 });
    recentSignups = (authData?.users ?? [])
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);
  } catch {
    // auth.admin 권한 없을 경우 무시
  }

  // 가입자별 플랜 조인
  const signupIds = recentSignups.map((u) => u.id);
  const { data: signupProfiles } =
    signupIds.length > 0
      ? await admin.from("users").select("id, subscription_plan").in("id", signupIds)
      : { data: [] };
  const planMap: Record<string, string> = {};
  for (const p of signupProfiles ?? []) {
    planMap[p.id as string] = (p.subscription_plan as string) ?? "free";
  }

  const t = await getTranslations("Admin");

  const PLAN_COLORS: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    starter: "bg-blue-100 text-blue-700",
    pro: "bg-purple-100 text-purple-700",
    pay_per_use: "bg-orange-100 text-orange-700",
  };

  const STATUS_COLORS: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans">
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* 헤더 */}
        <h1 className="mb-1 text-2xl font-semibold text-[var(--content)]">
          {t("title")}
        </h1>
        <p className="mb-10 text-sm text-[var(--content-muted)]">
          {t("subtitle")}
        </p>

        {/* 핵심 지표 */}
        <section className="mb-10">
          <h2 className="mb-4 text-base font-medium text-[var(--content)]">
            {t("metrics")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: t("totalUsers"), value: totalUsersResult.count ?? 0 },
              {
                label: t("totalConversions"),
                value: totalConversionsResult.count ?? 0,
              },
              {
                label: t("todayConversions"),
                value: todayConversionsResult.count ?? 0,
              },
              {
                label: t("activeSubscribers"),
                value: activeSubscribersResult.count ?? 0,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
              >
                <p className="text-xs text-[var(--content-muted)]">{label}</p>
                <p className="mt-1 text-3xl font-bold text-[var(--content)]">
                  {value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 플랜별 사용자 */}
        <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-base font-medium text-[var(--content)]">
            {t("planBreakdown")}
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(planBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2"
                >
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      PLAN_COLORS[plan] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {plan}
                  </span>
                  <span className="text-sm font-semibold text-[var(--content)]">
                    {count.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {/* 최근 가입자 */}
        <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-base font-medium text-[var(--content)]">
            {t("recentSignups")}
          </h2>
          {recentSignups.length === 0 ? (
            <p className="text-sm text-[var(--content-muted)]">—</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--content-muted)]">
                    <th className="pb-2 pr-4 font-medium">{t("email")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("plan")}</th>
                    <th className="pb-2 font-medium">{t("joinedAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignups.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2 pr-4 text-[var(--content)]">
                        {u.email ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            PLAN_COLORS[planMap[u.id] ?? "free"] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {planMap[u.id] ?? "free"}
                        </span>
                      </td>
                      <td className="py-2 text-[var(--content-muted)]">
                        {new Date(u.created_at).toLocaleDateString(locale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 최근 변환 내역 */}
        <section className="mb-10 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-base font-medium text-[var(--content)]">
            {t("recentConversions")}
          </h2>
          {!recentConversionsResult.data?.length ? (
            <p className="text-sm text-[var(--content-muted)]">—</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--content-muted)]">
                    <th className="pb-2 pr-4 font-medium">{t("file")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("user")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("status")}</th>
                    <th className="pb-2 font-medium">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentConversionsResult.data.map((c) => (
                    <tr
                      key={c.id as string}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="max-w-[200px] truncate py-2 pr-4 text-[var(--content)]">
                        {(c.original_filename as string) ?? "—"}
                      </td>
                      <td className="max-w-[120px] truncate py-2 pr-4 font-mono text-xs text-[var(--content-muted)]">
                        {((c.user_id as string) ?? "").slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[c.status as string] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {c.status as string}
                        </span>
                      </td>
                      <td className="py-2 text-[var(--content-muted)]">
                        {new Date(c.created_at as string).toLocaleDateString(
                          locale,
                          { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 웹훅 이벤트 로그 */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-base font-medium text-[var(--content)]">
            {t("webhookEvents")}
          </h2>
          {!webhookEventsResult.data?.length ? (
            <p className="text-sm text-[var(--content-muted)]">—</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--content-muted)]">
                    <th className="pb-2 pr-4 font-medium">{t("eventType")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("user")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("processed")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("error")}</th>
                    <th className="pb-2 font-medium">{t("date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {webhookEventsResult.data.map((ev) => (
                    <tr
                      key={ev.id as string}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono text-xs text-[var(--content)]">
                        {ev.event_type as string}
                      </td>
                      <td className="max-w-[100px] truncate py-2 pr-4 font-mono text-xs text-[var(--content-muted)]">
                        {ev.user_id
                          ? ((ev.user_id as string).slice(0, 8) + "…")
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            ev.processed
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ev.processed ? "✓" : "pending"}
                        </span>
                      </td>
                      <td className="max-w-[160px] truncate py-2 pr-4 text-xs text-red-500">
                        {(ev.error as string | null) ?? ""}
                      </td>
                      <td className="py-2 text-[var(--content-muted)]">
                        {new Date(ev.created_at as string).toLocaleDateString(
                          locale,
                          { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
