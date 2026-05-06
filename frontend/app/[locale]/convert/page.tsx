import { getTranslations } from "next-intl/server";
import FileUpload from "@/app/components/FileUpload";

export default async function ConvertPage() {
  const t = await getTranslations("Convert");

  return (
    <div className="min-h-screen bg-[var(--page-bg)] font-sans">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[var(--content)]">
          {t("title")}
        </h1>
        <p className="mb-10 text-[var(--content-muted)]">
          {t("subtitle")}
        </p>
        <FileUpload />
      </main>
    </div>
  );
}
