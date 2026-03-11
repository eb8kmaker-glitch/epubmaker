import { getTranslations } from "next-intl/server";
import FileUpload from "@/app/components/FileUpload";

export default async function ConvertPage() {
  const t = await getTranslations("Convert");

  return (
    <div className="min-h-screen bg-zinc-100 font-sans dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("title")}
        </h1>
        <p className="mb-10 text-zinc-600 dark:text-zinc-400">
          {t("subtitle")}
        </p>
        <FileUpload />
      </main>
    </div>
  );
}
