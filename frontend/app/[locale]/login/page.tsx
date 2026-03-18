"use client";

/**
 * 로그인 페이지.
 *
 * Supabase 클라이언트: createBrowserClient() — 로그인/회원가입은 클라이언트에서 처리.
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function LoginForm() {
  const t = useTranslations("Login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/convert";
  const locale = pathname.split("/")[1] || "en";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) {
        setError(t("error"));
        return;
      }
      // router.refresh()로 서버 세션을 먼저 동기화한 뒤 이동.
      // push → refresh 순이면 push 중에 현재 페이지를 재렌더해서 미들웨어 리다이렉트와 충돌.
      router.refresh();
      router.push(redirect);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/${locale}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  }

  return (
    <main className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold text-[var(--content)]">
        {t("title")}
      </h1>
      <p className="mb-6 text-sm text-[var(--content-muted)]">
        {t("subtitle")}
      </p>

      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-[var(--content)] hover:bg-[var(--dropzone-hover)] disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? "…" : t("googleButton")}
      </button>

      <div className="mb-4 flex items-center gap-3">
        <hr className="flex-1 border-[var(--border)]" />
        <span className="text-xs text-[var(--content-muted)]">{t("orDivider")}</span>
        <hr className="flex-1 border-[var(--border)]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-[var(--content)]"
          >
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--content)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-[var(--content)]"
          >
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-[var(--content)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--primary)] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : t("submit")}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--content-muted)]">
        {t("noAccount")}{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--primary)] hover:underline"
        >
          {t("signUp")}
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-[var(--content-muted)]">
        <Link href="/" className="hover:text-[var(--primary)]">
          {tCommon("backToHome")}
        </Link>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans flex items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
