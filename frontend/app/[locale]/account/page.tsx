import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerClient } from "@/lib/supabase";
import PasswordChangeForm from "@/app/components/PasswordChangeForm";
import DeleteAccountSection from "@/app/components/DeleteAccountSection";

type Props = { params: Promise<{ locale: string }> };

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const t = await getTranslations("Account");

  // Email users can change password; Google-only OAuth users cannot
  const isEmailUser =
    user.app_metadata?.provider === "email" ||
    user.identities?.some(
      (id: { provider: string }) => id.provider === "email"
    );

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans">
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-2xl font-semibold text-[var(--content)]">
          {t("title")}
        </h1>
        <p className="mb-8 text-[var(--content-muted)]">{t("subtitle")}</p>

        {/* Account info */}
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--content-muted)]">
                {t("email")}
              </p>
              <p className="mt-1 text-sm text-[var(--content)]">{user.email}</p>
            </div>
          </div>
        </section>

        {/* Password change */}
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="mb-4 text-lg font-medium text-[var(--content)]">
            {t("changePassword")}
          </h2>
          {isEmailUser ? (
            <PasswordChangeForm />
          ) : (
            <p className="text-sm text-[var(--content-muted)]">
              {t("googleAccount")}
            </p>
          )}
        </section>

        {/* Delete account */}
        <section className="rounded-xl border border-red-200 bg-[var(--card)] p-6">
          <h2 className="mb-2 text-lg font-medium text-red-600">
            {t("deleteAccount")}
          </h2>
          <p className="mb-4 text-sm text-[var(--content-muted)]">
            {t("deleteAccountDesc")}
          </p>
          <DeleteAccountSection locale={locale} />
        </section>
      </main>
    </div>
  );
}
