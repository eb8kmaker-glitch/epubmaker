import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-white px-6 py-20 dark:border-zinc-800 dark:bg-zinc-900/50 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Convert DOCX and TXT to EPUB instantly
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Professional EPUB conversion for writers and publishers.
          </p>
          <Link
            href="/convert"
            className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            Start Converting
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                1
              </span>
              <h3 className="mt-4 font-medium">Upload your DOCX or TXT file</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Drag and drop or choose a file from your device.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                2
              </span>
              <h3 className="mt-4 font-medium">Configure conversion settings</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Set metadata, cover, TOC, and styling options.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                3
              </span>
              <h3 className="mt-4 font-medium">Download your EPUB</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Get a ready-to-publish EPUB file and preview it in-browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-white px-6 py-16 dark:border-zinc-800 dark:bg-zinc-900/30 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Features
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "DOCX & TXT Support", desc: "Convert Word documents and plain text to standard EPUB." },
              { title: "Automatic TOC generation", desc: "Table of contents with configurable depth (1–3)." },
              { title: "Cover image support", desc: "Upload a JPEG or PNG cover for your ebook." },
              { title: "CSS styling presets", desc: "Choose from Default, Book, Novel, or Academic styles." },
              { title: "Metadata editor", desc: "Set title, author, language, publisher, and date." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-700 dark:bg-zinc-800/30"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{f.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Plans
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Free",
                price: "$0 / month",
                features: ["5 conversions per month"],
              },
              {
                name: "Starter",
                price: "$9 / month",
                features: [
                  "100 conversions per month",
                  "Most popular for indie authors",
                ],
              },
              {
                name: "Pro",
                price: "$19 / month",
                features: [
                  "Unlimited conversions",
                  "Priority conversion",
                ],
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {plan.name}
                </h3>
                <p className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {plan.price}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Need more options? See all pricing plans.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:focus:ring-offset-zinc-900"
            >
              View full pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 bg-emerald-600 px-6 py-16 dark:border-zinc-800 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-medium text-white sm:text-xl">
            Start converting your manuscript to EPUB today.
          </p>
          <Link
            href="/convert"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-emerald-600"
          >
            Convert Now
          </Link>
        </div>
      </section>
    </div>
  );
}
