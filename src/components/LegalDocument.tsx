import Link from "next/link";

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <div className="min-h-screen paper-texture px-4 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <header className="mb-10">
          <Link
            href="/"
            className="font-display text-lg font-semibold text-ink-900 transition hover:text-ink-700"
          >
            English Journal
          </Link>
          <h1 className="mt-6 font-display text-3xl font-semibold text-ink-900">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-ink-600 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-sage-700 [&_a]:underline-offset-2 hover:[&_a]:underline">
          {children}
        </div>

        <footer className="mt-12 border-t border-ink-200/60 pt-6 text-sm text-ink-500">
          <Link href="/" className="font-medium text-sage-700 underline-offset-2 hover:underline">
            ← Back to English Journal
          </Link>
        </footer>
      </article>
    </div>
  );
}
